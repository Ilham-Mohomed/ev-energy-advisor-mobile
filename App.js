import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StyleSheet, StatusBar } from "react-native";

const scenarios = [
  { id: "S1", name: "Home → Home", mode: "V2G", note: "Charge at home; discharge to grid from home." },
  { id: "S2", name: "Home → Station", mode: "V2G", note: "Charge at home; discharge at a compatible station." },
  { id: "S3", name: "Station → Home", mode: "V2G", note: "Charge at a station; discharge to grid from home." },
  { id: "S4", name: "Station → Station", mode: "V2G", note: "Charge and discharge at compatible public stations." },
  { id: "S5", name: "V2H – Home charging", mode: "V2H", note: "Use stored EV energy to support household demand." },
  { id: "S6", name: "V2H – Public charging", mode: "V2H", note: "Charge publicly and use stored energy at home." }
];
const n = (v, d=0) => Number.isFinite(Number(v)) ? Number(v) : d;
const money = v => `LKR ${Math.round(v).toLocaleString("en-LK")}`;

export default function App() {
  const [tab, setTab] = useState("customer");
  const [battery, setBattery] = useState("50");
  const [distance, setDistance] = useState("40");
  const [efficiency, setEfficiency] = useState("6");
  const [household, setHousehold] = useState("12");
  const [peak, setPeak] = useState("106");
  const [offpeak, setOffpeak] = useState("33");
  const [exportRate, setExportRate] = useState("45");
  const [chargerCost, setChargerCost] = useState("500000");
  const [dailyDischarge, setDailyDischarge] = useState("10");
  const [years, setYears] = useState("5");
  const [discount, setDiscount] = useState("10");
  const [selected, setSelected] = useState("S1");

  const results = useMemo(() => {
    const batt=n(battery,50), km=n(distance,40), kmkwh=Math.max(.01,n(efficiency,6));
    const home=n(household,12), p=n(peak,106), off=n(offpeak,33), exp=n(exportRate,45);
    const capex=n(chargerCost,500000), days=300, d=Math.min(Math.max(n(dailyDischarge,10),0),Math.max(batt*.8,0));
    const y=Math.max(1,n(years,5)), r=Math.max(0,n(discount,10))/100;
    const drivingEnergy=km/kmkwh;
    const usable=Math.max(0,batt*.9-drivingEnergy);
    return scenarios.map((s,i)=>{
      const isHome=s.mode==="V2H";
      const feasible = batt>0 && drivingEnergy < batt*.9 && (isHome ? usable>0 : d>0);
      const daily = isHome ? Math.min(home, usable, d) : Math.min(d, usable);
      const annual = daily*days;
      const fixed = capex*(i===0?1:(i===1?1.08:i===2?1.12:i===3?1.2:i===4?0.55:0.72));
      const annualFixed = fixed * (r===0 ? 1/y : (r*Math.pow(1+r,y))/(Math.pow(1+r,y)-1));
      const annualVariable = annual*(isHome?off:Math.max(0,off-exp)*0.15) + annual*2.5;
      const bep = annual>0 ? (annualFixed+annualVariable)/annual : 0;
      const benefit = annual*(isHome?p:exp);
      const net = benefit-annualVariable-annualFixed;
      return {...s, feasible, daily, annual, bep, net, fixed, reason: !feasible ? "Insufficient usable battery energy for this input." : "Technically possible under the entered assumptions."};
    });
  },[battery,distance,efficiency,household,peak,offpeak,exportRate,chargerCost,dailyDischarge,years,discount]);

  const ranked = [...results].filter(x=>x.feasible).sort((a,b)=>b.net-a.net);
  const best = ranked[0];
  const field = (label,value,set,unit) => <View style={styles.field} key={label}><Text style={styles.label}>{label}{unit?` (${unit})`:""}</Text><TextInput style={styles.input} value={value} onChangeText={set} keyboardType="decimal-pad" /></View>;
  const card = (title, value, sub) => <View style={styles.metric} key={title}><Text style={styles.metricLabel}>{title}</Text><Text style={styles.metricValue}>{value}</Text>{sub?<Text style={styles.muted}>{sub}</Text>:null}</View>;

  return <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content" backgroundColor="#09283D"/>
    <View style={styles.header}><Text style={styles.brand}>⚡ EV ENERGY ADVISOR</Text><Text style={styles.tagline}>V2G & V2H decision support · Sri Lanka</Text></View>
    <View style={styles.tabs}><Pressable onPress={()=>setTab("customer")} style={[styles.tab,tab==="customer"&&styles.activeTab]}><Text style={[styles.tabText,tab==="customer"&&styles.activeTabText]}>Customer</Text></Pressable><Pressable onPress={()=>setTab("utility")} style={[styles.tab,tab==="utility"&&styles.activeTab]}><Text style={[styles.tabText,tab==="utility"&&styles.activeTabText]}>Utility officer</Text></Pressable></View>
    {tab==="customer" ? <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your EV energy profile</Text><Text style={styles.muted}>Enter your details to compare six illustrative V2G/V2H options.</Text>
      <View style={styles.panel}>{field("EV battery capacity",battery,setBattery,"kWh")}{field("Daily driving distance",distance,setDistance,"km/day")}{field("EV energy efficiency",efficiency,setEfficiency,"km/kWh")}{field("Household electricity demand",household,setHousehold,"kWh/day")}</View>
      <Text style={styles.heading}>Economic assumptions</Text><View style={styles.panel}>{field("Peak electricity tariff",peak,setPeak,"LKR/kWh")}{field("Off-peak electricity tariff",offpeak,setOffpeak,"LKR/kWh")}{field("V2G export/payment rate",exportRate,setExportRate,"LKR/kWh")}{field("Initial charger cost",chargerCost,setChargerCost,"LKR")}{field("Target daily discharge",dailyDischarge,setDailyDischarge,"kWh/day")}{field("Analysis period",years,setYears,"years")}{field("Discount rate",discount,setDiscount,"%")}</View>
      <Text style={styles.heading}>Scenario comparison</Text>
      {best ? <View style={styles.recommend}><Text style={styles.recommendKicker}>TOP OPTION UNDER CURRENT INPUTS</Text><Text style={styles.recommendTitle}>{best.id} · {best.name}</Text><Text style={styles.recommendText}>Estimated annual net value: {money(best.net)} · BEP: {money(best.bep)}/kWh</Text></View> : <View style={styles.panel}><Text>No scenario is feasible with the current inputs. Check your battery and driving assumptions.</Text></View>}
      {results.map(x=><Pressable key={x.id} onPress={()=>setSelected(x.id)} style={[styles.result,selected===x.id&&styles.selected]}><View style={styles.resultTop}><Text style={styles.resultTitle}>{x.id} · {x.name}</Text><Text style={[styles.pill,x.feasible?styles.ok:styles.no]}>{x.feasible?"Feasible*":"Not feasible"}</Text></View><Text style={styles.muted}>{x.note}</Text><View style={styles.resultNumbers}><Text style={styles.number}>BEP: {money(x.bep)}/kWh</Text><Text style={styles.number}>Net/year: {money(x.net)}</Text></View><Text style={styles.small}>{x.reason}</Text></Pressable>)}
      <View style={styles.warning}><Text style={styles.warningTitle}>Research prototype notice</Text><Text style={styles.small}>These are preliminary illustrative calculations, not an approved tariff, engineering assessment, or investment recommendation. Scenario-specific costs, charger compatibility, grid rules, taxes, degradation, and the validated research workbook must be incorporated before real customer use. Feasibility is indicative only.</Text></View>
    </ScrollView> : <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Utility officer overview</Text><Text style={styles.muted}>Demonstration dashboard using the current device session; no customer records are uploaded.</Text>
      <View style={styles.metrics}>{card("Scenario pathways","6","4 V2G · 2 V2H")}{card("Analysis period",`${years} years`,"Editable customer assumption")}</View>
      <View style={styles.panel}><Text style={styles.panelTitle}>Current profile summary</Text><Text style={styles.summaryLine}>Battery: {battery} kWh</Text><Text style={styles.summaryLine}>Driving: {distance} km/day</Text><Text style={styles.summaryLine}>Household demand: {household} kWh/day</Text><Text style={styles.summaryLine}>Best indicative option: {best?`${best.id} · ${best.name}`:"None feasible"}</Text></View>
      <Text style={styles.heading}>Scenario screening</Text>{results.map(x=><View key={x.id} style={styles.officerRow}><Text style={styles.resultTitle}>{x.id} · {x.name}</Text><Text style={styles.muted}>{x.feasible?"Indicatively feasible":"Requires review"} · BEP {money(x.bep)}/kWh</Text></View>)}
      <View style={styles.warning}><Text style={styles.warningTitle}>Data and privacy</Text><Text style={styles.small}>This prototype stores inputs only in the current app session. Authentication, secure cloud database, multi-customer reporting, and utility permissions are not connected.</Text></View>
    </ScrollView>}
    <View style={styles.footer}><Text style={styles.footerText}>EV ENERGY ADVISOR · PROTOTYPE BUILD</Text></View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F3F6F8"},header:{backgroundColor:"#09283D",paddingHorizontal:20,paddingTop:18,paddingBottom:17},brand:{color:"#FFFFFF",fontSize:19,fontWeight:"900",letterSpacing:1},tagline:{color:"#BBD0DC",fontSize:12,marginTop:5},
 tabs:{flexDirection:"row",backgroundColor:"#FFFFFF",paddingHorizontal:16,paddingTop:10,borderBottomWidth:1,borderBottomColor:"#E0E7EC"},tab:{paddingVertical:12,paddingHorizontal:18,marginRight:8,borderBottomWidth:3,borderBottomColor:"transparent"},activeTab:{borderBottomColor:"#00A6A0"},tabText:{color:"#60717D",fontWeight:"700"},activeTabText:{color:"#09283D"},
 content:{padding:16,paddingBottom:30},heading:{fontSize:18,fontWeight:"800",color:"#102F43",marginTop:15,marginBottom:6},muted:{color:"#687C88",fontSize:12,lineHeight:18},panel:{backgroundColor:"#FFFFFF",borderRadius:14,padding:14,marginTop:10,borderWidth:1,borderColor:"#E5EBEF"},field:{marginBottom:11},label:{fontSize:12,fontWeight:"700",color:"#435966",marginBottom:5},input:{height:43,borderRadius:9,borderWidth:1,borderColor:"#D9E2E8",paddingHorizontal:12,color:"#102F43",backgroundColor:"#FBFCFD",fontSize:15},
 recommend:{backgroundColor:"#0C4554",padding:16,borderRadius:14,marginTop:10},recommendKicker:{color:"#8FE4D7",fontSize:10,fontWeight:"900",letterSpacing:1},recommendTitle:{color:"#FFFFFF",fontSize:18,fontWeight:"900",marginTop:7},recommendText:{color:"#D8F0EC",fontSize:12,marginTop:6},
 result:{backgroundColor:"#FFFFFF",borderRadius:13,padding:14,marginTop:10,borderWidth:1,borderColor:"#E1E8ED"},selected:{borderColor:"#00A6A0",borderWidth:2},resultTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8},resultTitle:{fontSize:14,fontWeight:"800",color:"#16374B",flexShrink:1},pill:{fontSize:10,fontWeight:"800",overflow:"hidden",paddingHorizontal:9,paddingVertical:5,borderRadius:20},ok:{backgroundColor:"#DDF5EC",color:"#176C50"},no:{backgroundColor:"#FBE6E4",color:"#A43B32"},resultNumbers:{flexDirection:"row",justifyContent:"space-between",marginTop:10,flexWrap:"wrap"},number:{fontSize:12,fontWeight:"800",color:"#0D5360"},small:{fontSize:11,color:"#687C88",lineHeight:16,marginTop:7},
 warning:{backgroundColor:"#FFF8E8",borderColor:"#F1DCA7",borderWidth:1,borderRadius:12,padding:13,marginTop:16},warningTitle:{fontWeight:"900",color:"#805B13",marginBottom:5,fontSize:12},
 metrics:{flexDirection:"row",gap:10,marginTop:10},metric:{flex:1,backgroundColor:"#FFFFFF",borderRadius:13,padding:14,borderWidth:1,borderColor:"#E5EBEF"},metricLabel:{fontSize:11,color:"#687C88",fontWeight:"700"},metricValue:{fontSize:19,fontWeight:"900",color:"#0D5360",marginTop:7},panelTitle:{fontSize:14,fontWeight:"900",color:"#16374B",marginBottom:8},summaryLine:{fontSize:13,color:"#435966",paddingVertical:4},officerRow:{backgroundColor:"#FFFFFF",borderRadius:11,padding:13,marginTop:8,borderWidth:1,borderColor:"#E5EBEF"},footer:{padding:9,alignItems:"center",backgroundColor:"#E9EFF3"},footerText:{fontSize:9,color:"#73838C",fontWeight:"800",letterSpacing:1}
});
