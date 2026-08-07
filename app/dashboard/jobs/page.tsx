"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";


export default function JobsPage(){


const [jobs,setJobs]=useState<any[]>([]);
const [loading,setLoading]=useState(true);
const [profile,setProfile]=useState<any>(null);

const [search,setSearch]=useState("");
const [status,setStatus]=useState("");
const [date,setDate]=useState("");
const [time,setTime]=useState("");



useEffect(()=>{

loadProfile();
loadJobs();

},[]);




async function loadProfile(){

const {
data:{
user
}
}=await supabase.auth.getUser();


if(!user) return;


const {data}=await supabase
.from("profiles")
.select("role")
.eq("id",user.id)
.single();


setProfile(data);

}




async function loadJobs(){


const {data,error}=await supabase
.from("jobs")
.select(`

id,
status,
scheduled_date,
scheduled_time,
total_price,
profit,
created_at,

clients(
name,
phone,
zip_code
),

salesmen(
name,
commission_percent
)

`)
.order("created_at",{ascending:false});



if(error){

alert(error.message);
return;

}


setJobs(data || []);

setLoading(false);

}




async function deleteJob(id:string){


if(!confirm("Delete this job?"))
return;



const {error}=await supabase
.from("jobs")
.delete()
.eq("id",id);



if(error){

alert(error.message);
return;

}


loadJobs();


}




if(loading){

return(

<div style={{padding:30}}>
Loading Jobs...
</div>

)

}





const filteredJobs = jobs.filter(job=>{


const text = `

${job.clients?.name || ""}
${job.clients?.phone || ""}
${job.salesmen?.name || ""}
${job.status || ""}

`.toLowerCase();



return (

text.includes(search.toLowerCase())

&&

(
status
?
job.status===status
:
true
)

&&

(
date
?
job.scheduled_date===date
:
true
)

&&

(
time
?
job.scheduled_time===time
:
true
)

);


});






return(


<div style={{padding:30}}>


<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}
>


<div>

<h1
style={{
fontSize:32,
fontWeight:800,
color:"#111827"
}}
>
Jobs
</h1>


<p style={{color:"#6B7280"}}>
Manage roofing projects
</p>


</div>



<Link href="/dashboard/jobs/new">

<button

style={{
background:"#D4AF37",
border:0,
padding:"12px 22px",
borderRadius:10,
fontWeight:700
}}

>

+ New Job

</button>

</Link>


</div>






<input

placeholder="Search client, phone, salesman..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

style={{

marginTop:25,
padding:12,
width:350,
borderRadius:8,
border:"1px solid #D1D5DB"

}}

/>


<input

type="date"

value={date}

onChange={(e)=>setDate(e.target.value)}

style={{

marginLeft:10,
padding:12,
borderRadius:8,
border:"1px solid #D1D5DB"

}}

/>



<select

value={time}

onChange={(e)=>setTime(e.target.value)}

style={{

marginLeft:10,
padding:12,
borderRadius:8

}}

>

<option value="">
All Times
</option>


<option value="09:00-11:00">
9 AM - 11 AM
</option>


<option value="11:00-13:00">
11 AM - 1 PM
</option>


<option value="13:00-15:00">
1 PM - 3 PM
</option>


<option value="15:00-17:00">
3 PM - 5 PM
</option>


<option value="11:00">
11:00 Exact
</option>


<option value="14:00">
2:00 Exact
</option>


<option value="15:30">
3:30 Exact
</option>


</select>


<select

value={status}

onChange={(e)=>setStatus(e.target.value)}

style={{

marginLeft:10,
padding:12,
borderRadius:8

}}

>

<option value="">
All Status
</option>

<option value="new">
New
</option>

<option value="inspection">
Inspection
</option>

<option value="approved">
Approved
</option>

<option value="scheduled">
Scheduled
</option>

<option value="in_progress">
In Progress
</option>

<option value="done">
Done
</option>


</select>







<div

style={{

marginTop:30,
background:"#fff",
borderRadius:16,
border:"1px solid #E5E7EB",
overflowX:"auto"

}}

>



<table

style={{

width:"100%",
borderCollapse:"collapse",
minWidth:900

}}

>



<thead>

<tr

style={{

background:"#111827",
color:"#D4AF37"

}}

>


<th style={{padding:15,textAlign:"left"}}>
Client
</th>


<th style={{padding:15,textAlign:"left"}}>
Salesman
</th>


<th style={{padding:15,textAlign:"left"}}>
Status
</th>


<th style={{padding:15,textAlign:"left"}}>
Price
</th>


<th style={{padding:15,textAlign:"left"}}>
Profit
</th>


<th style={{padding:15,textAlign:"left"}}>
Date
</th>


<th style={{padding:15,textAlign:"left"}}>
Time
</th>


<th style={{padding:15,textAlign:"left"}}>
Action
</th>


</tr>

</thead>




<tbody>


{

filteredJobs.map(job=>(


<tr

key={job.id}

style={{

borderBottom:"1px solid #E5E7EB"

}}

>


<td style={{padding:15}}>

<b>
{job.clients?.name || "-"}
</b>

<br/>

<span style={{fontSize:13,color:"#6B7280"}}>
{job.clients?.phone}
</span>


</td>



<td style={{padding:15}}>

{job.salesmen?.name || "Not Assigned"}

</td>




<td style={{padding:15}}>


<span

style={{

background:"#FEF3C7",
padding:"6px 12px",
borderRadius:20,
fontWeight:700,
fontSize:13

}}

>

{job.status}

</span>


</td>




<td style={{padding:15,fontWeight:700}}>

${Number(job.total_price || 0).toLocaleString()}

</td>




<td style={{padding:15,fontWeight:700,color:"#059669"}}>

${Number(job.profit || 0).toLocaleString()}

</td>




<td style={{padding:15}}>

{job.scheduled_date || "-"}

</td>


<td style={{padding:15}}>

{job.scheduled_time || "-"}

</td>




<td style={{padding:15}}>


<Link href={`/dashboard/jobs/${job.id}`}>

<button

style={{

background:"#111827",
color:"white",
border:0,
padding:"8px 14px",
borderRadius:8

}}

>

View

</button>

</Link>



{

profile?.role==="admin" &&

<button

onClick={()=>deleteJob(job.id)}

style={{

marginLeft:8,
background:"#DC2626",
color:"white",
border:0,
padding:"8px 14px",
borderRadius:8

}}

>

Delete

</button>


}



</td>


</tr>


))

}


</tbody>


</table>


</div>


</div>


)


}