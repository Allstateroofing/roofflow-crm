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


const {data,error}=await supabase
.from("profiles")
.select("role")
.eq("id",user.id)
.single();


if(error){

alert(error.message);
return;

}


setProfile(data);

}


async function loadJobs(){


const {data,error}=await supabase
.from("jobs")
.select(`
id,
status,
scheduled_date,
total_price,
profit,
created_at,

clients!jobs_client_id_fkey(
name,
phone,
zip_code
),

salesmen!jobs_salesman_id_fkey(
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


const ok=confirm(
"Delete this job?"
);


if(!ok)return;



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

return (

<div style={{padding:30}}>

Loading Jobs...

</div>

)

}






const filtered =
jobs.filter(job=>{


const text =

`
${job.clients?.name || ""}
${job.clients?.phone || ""}
${job.salesmen?.name || ""}
${job.status || ""}
`
.toLowerCase();



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

);


});







const revenue =

jobs.reduce(

(sum,job)=>

sum + Number(job.total_price || 0),

0

);





const profit =

jobs.reduce(

(sum,job)=>

sum + Number(job.profit || 0),

0

);






const commission =

jobs.reduce(

(sum,job)=>{

const c =
Number(job.salesmen?.commission_percent || 0);

return (

sum +

(
Number(job.profit || 0)
*
c
/
100

)

);

},

0

);








return (

<div style={{padding:30}}>


<h1>
Jobs Dashboard
</h1>




<Link href="/dashboard/jobs/new">

<button>
+ New Job
</button>

</Link>





<br/><br/>





<input

placeholder="Search client, phone, salesman..."

value={search}

onChange={(e)=>
setSearch(e.target.value)
}

style={{
padding:10,
width:300
}}

/>





<select

value={status}

onChange={(e)=>
setStatus(e.target.value)
}

style={{
marginLeft:10,
padding:10
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


<option value="estimate_sent">
Estimate Sent
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








<h2>
Revenue:
${revenue.toLocaleString()}
</h2>



<h2>
Profit:
${profit.toLocaleString()}
</h2>



<h2>
Salesman Commission:
${commission.toLocaleString()}
</h2>








<table

border={1}

cellPadding={10}

style={{
marginTop:30,
width:"100%",
borderCollapse:"collapse"
}}

>



<thead>

<tr>

<th>
Client
</th>

<th>
Salesman
</th>

<th>
Status
</th>

<th>
Price
</th>

<th>
Date
</th>

<th>
Action
</th>


</tr>

</thead>





<tbody>


{

filtered.map(job=>(


<tr key={job.id}>


<td>

{job.clients?.name}

<br/>

{job.clients?.phone}

</td>



<td>

{job.salesmen?.name || "-"}

</td>



<td>

{job.status}

</td>



<td>

${Number(job.total_price || 0).toLocaleString()}

</td>



<td>

{job.scheduled_date || "-"}

</td>




<td>


<Link href={`/dashboard/jobs/${job.id}`}>

<button>
View
</button>

</Link>



{
profile?.role === "admin" && (

<button

onClick={()=>
deleteJob(job.id)
}

style={{
marginLeft:10
}}

>

Delete

</button>

)
}



</td>



</tr>


))

}



</tbody>



</table>




</div>

)

}