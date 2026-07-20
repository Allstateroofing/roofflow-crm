"use client";

import {useEffect,useState} from "react";
import {useParams,useRouter} from "next/navigation";
import {supabase} from "@/lib/supabaseClient";


export default function SalesmanDetailPage(){

const {id}=useParams();
const router=useRouter();

const [loading,setLoading]=useState(true);

const [name,setName]=useState("");
const [phone,setPhone]=useState("");
const [email,setEmail]=useState("");
const [commission,setCommission]=useState(15);

const [jobs,setJobs]=useState<any[]>([]);



useEffect(()=>{
load();
},[]);



async function load(){

const {data,error}=await supabase
.from("salesmen")
.select("*")
.eq("id",id)
.single();


if(error){
alert(error.message);
return;
}


setName(data.name||"");
setPhone(data.phone||"");
setEmail(data.email||"");
setCommission(data.commission_percent||15);



const {data:jobData}=await supabase
.from("jobs")
.select(`
id,
status,
total_price,
profit,
scheduled_date,
clients!jobs_client_id_fkey(
name
)
`)
.eq("salesman_id",id);



setJobs(jobData||[]);

setLoading(false);

}




async function save(){

const {error}=await supabase
.from("salesmen")
.update({

name,
phone,
email,
commission_percent:commission

})
.eq("id",id);



if(error){
alert(error.message);
return;
}


alert("Saved");

load();

}




const totalProfit =
jobs.reduce(
(a,b)=>a+Number(b.profit||0),
0
);



const commissionAmount =
totalProfit * commission /100;




if(loading)
return <div>Loading...</div>;



return (

<div style={{padding:30}}>


<h1>
Salesman Detail
</h1>


<input
value={name}
onChange={e=>setName(e.target.value)}
placeholder="Name"
/>


<br/><br/>


<input
value={phone}
onChange={e=>setPhone(e.target.value)}
placeholder="Phone"
/>


<br/><br/>


<input
value={email}
onChange={e=>setEmail(e.target.value)}
placeholder="Email"
/>


<br/><br/>


<input
type="number"
value={commission}
onChange={e=>setCommission(Number(e.target.value))}
placeholder="Commission"
/>


<br/><br/>


<button onClick={save}>
Save
</button>



<hr/>


<h2>
Report
</h2>


<p>
Jobs: {jobs.length}
</p>


<p>
Profit:
${totalProfit.toLocaleString()}
</p>


<p>
Commission:
${commissionAmount.toLocaleString()}
</p>



<h2>
Jobs History
</h2>


{
jobs.map(job=>(

<div key={job.id}>

<p>
Client: {job.clients?.name}
</p>

<p>
Status: {job.status}
</p>

<p>
Price: ${job.total_price}
</p>

<p>
Profit: ${job.profit}
</p>

<hr/>

</div>

))

}



<button
onClick={()=>router.push("/dashboard/salesmen")}
>
Back
</button>


</div>

)

}