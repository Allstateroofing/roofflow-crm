"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
Card,
CardHeader,
CardTitle,
CardContent
} from "@/components/ui/card";
import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts";

import {
DollarSign,
Wallet,
TrendingUp,
Receipt,
BriefcaseBusiness,
CircleDollarSign
} from "lucide-react";



export default function Dashboard(){


const [data,setData]=useState<any>({

cards:{},

chart:[],

salesmanReport:[],

recentJobs:[],

recentPayments:[]

});


useEffect(()=>{

loadDashboard();

},[]);



async function loadDashboard(){
console.log("Dashboard loading...");


const {data:jobs,error:jobsError}=await supabase
.from("jobs")
.select(`
id,
status,
total_price,
profit,
created_at,
salesman_id,
client_id,
clients(
name
),
salesmen(
name,
commission_percent
)
`)
.order("created_at",{
ascending:false
});





if(jobsError){
console.log(jobsError);
alert(jobsError.message);
return;
}



const {data:expenses}=await supabase
.from("job_expenses")
.select("amount");



const {data:payments}=await supabase
.from("payments")
.select("id,amount,status");




let revenue=0;

let paid=0;

let expense=0;

let scheduled=0;

let progress=0;

let done=0;

let salesmanData:any = {};

(jobs || []).forEach(j=>{


revenue += Number(j.total_price || 0);


const salesman = Array.isArray(j.salesmen)
?
j.salesmen[0]
:
j.salesmen;


const salesmanName =
salesman?.name || "No Salesman";


if(!salesmanData[salesmanName]){


salesmanData[salesmanName]={

name:salesmanName,

sales:0,

profit:0,

commission:0

};


}



salesmanData[salesmanName].sales +=
Number(j.total_price || 0);



salesmanData[salesmanName].profit +=
Number(j.profit || 0);



salesmanData[salesmanName].commission +=

Number(j.profit || 0)

*

(
Number(
salesman?.commission_percent || 15
)

/100
);





if(j.status==="scheduled")
scheduled++;


if(j.status==="in_progress")
progress++;


if(j.status==="done")
done++;


});




(expenses || []).forEach(e=>{

expense += Number(e.amount || 0);

});




(payments || []).forEach(p=>{

if(p.status==="paid")
paid += Number(p.amount || 0);

});




setData({

cards:{

revenue,

paid,

balance:revenue-paid,

expense,

profit:(jobs || []).reduce(
(sum,j)=>sum+Number(j.profit || 0),
0
),

jobs:(jobs || []).length

},

salesmanReport:Object.values(salesmanData),

recentJobs:(jobs || []).slice(0,5),

recentPayments:(payments || []).slice(0,5),

chart:[

{
name:"Scheduled",
value:scheduled
},

{
name:"Progress",
value:progress
},

{
name:"Done",
value:done
}

]


});



}




return(

<div
style={{
padding:"25px",
width:"100%",
overflow:"hidden",
background:"#F9FAFB",
minHeight:"100vh"
}}
>


<div
style={{
marginBottom:30
}}
>

<h1
style={{
fontSize:"36px",
fontWeight:800,
color:"#0F172A",
letterSpacing:"-1px"
}}
>
Dashboard Overview
</h1>


<p
style={{
color:"#6B7280",
marginTop:5
}}
>
Monitor your sales, jobs and financial performance
</p>

</div>


<div
style={{
background:"#111827",
color:"white",
padding:"25px 30px",
borderRadius:20,
marginBottom:35,
display:"flex",
justifyContent:"space-between",
alignItems:"center",
boxShadow:"0 10px 30px rgba(0,0,0,0.12)"
}}
>


<div>

<h2
style={{
fontSize:24,
fontWeight:800,
marginBottom:8
}}
>
Welcome back 👋
</h2>


<p
style={{
color:"#CBD5E1",
fontSize:15
}}
>
Manage your roofing projects, clients and company finances from one place.
</p>


</div>



<div
style={{
fontSize:55
}}
>
🏠
</div>


</div>






<div

style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:20
}}

>


{[

{
title:"Revenue",
value:data.cards.revenue,
icon:DollarSign,
color:"#D4AF37"
},

{
title:"Paid",
value:data.cards.paid,
icon:Wallet,
color:"#16A34A"
},

{
title:"Balance",
value:data.cards.balance,
icon:CircleDollarSign,
color:"#2563EB"
},

{
title:"Expenses",
value:data.cards.expense,
icon:Receipt,
color:"#DC2626"
},

{
title:"Profit",
value:data.cards.profit,
icon:TrendingUp,
color:"#7C3AED"
},

{
title:"Jobs",
value:data.cards.jobs,
icon:BriefcaseBusiness,
color:"#374151"
}

].map((card:any)=>{


const Icon = card.icon;


return (

<Card

key={card.title}

style={{

borderRadius:16,
border:"1px solid #E5E7EB",
boxShadow:"0 8px 25px rgba(0,0,0,0.05)",
background:"#FFFFFF",
overflow:"hidden",
position:"relative"

}}
>

<div
style={{
height:5,
background:card.color
}}
/>


<CardHeader>


<div

style={{

display:"flex",
justifyContent:"space-between",
alignItems:"center"

}}

>


<CardTitle>
{card.title}
</CardTitle>


<div

style={{

width:40,
height:40,
borderRadius:12,
background:card.color,
display:"flex",
alignItems:"center",
justifyContent:"center",
color:"white"

}}

>

<Icon size={20}/>

</div>


</div>


</CardHeader>



<CardContent>


<h2

style={{

fontSize:28,
fontWeight:700,
color:"#111827"

}}

>

{
card.title==="Jobs"
?
Number(card.value || 0)
:
"$"+Number(card.value || 0).toLocaleString()
}

</h2>


</CardContent>


</Card>

)

})


}


</div>


<h2 style={{marginTop:40}}>
Jobs Status
</h2>




<div
style={{
width:"100%",
height:320,
marginTop:30,
background:"#FFFFFF",
borderRadius:16,
padding:20,
boxShadow:"0 8px 25px rgba(0,0,0,0.05)",
border:"1px solid #E5E7EB"
}}
>


<h2
style={{
fontSize:20,
fontWeight:700,
marginBottom:20,
color:"#111827"
}}
>
Jobs Overview
</h2>


<ResponsiveContainer>


<BarChart data={data.chart}>


<XAxis 
dataKey="name"
axisLine={false}
tickLine={false}
/>


<YAxis
axisLine={false}
tickLine={false}
/>


<Tooltip
contentStyle={{
borderRadius:12,
border:"1px solid #E5E7EB"
}}
/>


<Bar

dataKey="value"

fill="#D4AF37"

radius={[8,8,0,0]}

/>


</BarChart>


</ResponsiveContainer>


</div>
<hr style={{marginTop:40}} />

<h2
style={{
marginTop:40,
fontSize:22,
fontWeight:700,
color:"#111827"
}}
>
Recent Jobs
</h2>


<div
style={{
background:"#FFFFFF",
borderRadius:16,
padding:20,
boxShadow:"0 8px 25px rgba(0,0,0,0.05)",
border:"1px solid #E5E7EB",
overflowX:"auto"
}}
>


<table
style={{
width:"100%",
borderCollapse:"collapse",
minWidth:650
}}
>


<thead>

<tr
style={{
background:"#111827",
color:"#D4AF37"
}}
>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Client
</th>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Status
</th>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Price
</th>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Date
</th>


</tr>

</thead>



<tbody>


{data.recentJobs.map((job:any)=>(

<tr
key={job.id}
style={{
borderBottom:"1px solid #E5E7EB"
}}
>


<td
style={{
padding:14,
fontWeight:600,
color:"#111827"
}}
>
{job.clients?.name || "-"}
</td>



<td
style={{
padding:14
}}
>


<span

style={{

padding:"6px 12px",
borderRadius:20,
fontSize:13,
fontWeight:600,

background:

job.status==="done"
?
"#DCFCE7"
:
job.status==="in_progress"
?
"#DBEAFE"
:
"#FEF3C7",


color:

job.status==="done"
?
"#166534"
:
job.status==="in_progress"
?
"#1D4ED8"
:
"#92400E"

}}

>

{job.status}

</span>


</td>



<td
style={{
padding:14,
fontWeight:700
}}
>
${Number(job.total_price || 0).toLocaleString()}
</td>



<td
style={{
padding:14,
color:"#6B7280"
}}
>

{
job.created_at
?
new Date(job.created_at).toLocaleDateString()
:
"-"
}

</td>


</tr>

))}


</tbody>


</table>


</div>


<hr style={{marginTop:40}} />

<h2
style={{
marginTop:40,
fontSize:22,
fontWeight:700,
color:"#111827"
}}
>
Salesman Performance
</h2>


<div
style={{
background:"#FFFFFF",
borderRadius:16,
padding:20,
boxShadow:"0 8px 25px rgba(0,0,0,0.05)",
border:"1px solid #E5E7EB",
overflowX:"auto"
}}
>


<table
style={{
width:"100%",
borderCollapse:"collapse",
minWidth:650
}}
>


<thead>

<tr
style={{
background:"#111827",
color:"#D4AF37"
}}
>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Salesman
</th>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Sales
</th>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Profit
</th>


<th
style={{
padding:14,
textAlign:"left"
}}
>
Commission
</th>


</tr>

</thead>


<tbody>


{data.salesmanReport.map((s:any)=>(

<tr
key={s.name}
style={{
borderBottom:"1px solid #E5E7EB"
}}
>


<td
style={{
padding:14,
fontWeight:600,
color:"#111827"
}}
>
{s.name}
</td>


<td
style={{
padding:14,
fontWeight:700
}}
>
${Number(s.sales).toLocaleString()}
</td>


<td
style={{
padding:14,
color:"#16A34A",
fontWeight:700
}}
>
${Number(s.profit).toLocaleString()}
</td>


<td
style={{
padding:14,
color:"#7C3AED",
fontWeight:700
}}
>
${Number(s.commission).toLocaleString()}
</td>


</tr>

))}


</tbody>


</table>
<hr style={{marginTop:40}} />


<h2
style={{
marginTop:40,
fontSize:22,
fontWeight:700,
color:"#111827"
}}
>
Recent Payments
</h2>


<div
style={{
background:"#FFFFFF",
borderRadius:16,
padding:20,
boxShadow:"0 8px 25px rgba(0,0,0,0.05)",
border:"1px solid #E5E7EB",
overflowX:"auto"
}}
>


<table
style={{
width:"100%",
borderCollapse:"collapse",
minWidth:500
}}
>


<thead>

<tr
style={{
background:"#111827",
color:"#D4AF37"
}}
>

<th style={{padding:14,textAlign:"left"}}>
Amount
</th>

<th style={{padding:14,textAlign:"left"}}>
Status
</th>

</tr>

</thead>


<tbody>

{data.recentPayments.map((p:any)=>(

<tr
key={p.id}
style={{
borderBottom:"1px solid #E5E7EB"
}}
>

<td
style={{
padding:14,
fontWeight:700
}}
>
${Number(p.amount || 0).toLocaleString()}
</td>


<td
style={{
padding:14
}}
>

<span
style={{
padding:"6px 12px",
borderRadius:20,
background:
p.status==="paid"
?
"#DCFCE7"
:
"#FEF3C7"
}}
>
{p.status}
</span>

</td>


</tr>

))}


</tbody>


</table>


</div>

</div>

</div>

);
}







