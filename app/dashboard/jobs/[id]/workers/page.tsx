"use client";

import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "@/lib/supabase";


export default function JobWorkersPage(){

const {id}=useParams();


const [workers,setWorkers]=useState<any[]>([]);
const [assigned,setAssigned]=useState<any[]>([]);

const [workerId,setWorkerId]=useState("");



useEffect(()=>{

load();

},[]);





async function load(){


const {data:w,error}=await supabase
.from("workers")
.select("*")
.order("name");


if(error){

alert(error.message);
return;

}


setWorkers(w || []);





const {data:j,error:je}=await supabase
.from("job_workers")
.select(`
id,
workers(
name,
phone,
role
)
`)
.eq("job_id",id);



if(je){

alert(je.message);
return;

}


setAssigned(j || []);


}








async function addWorker(){


if(!workerId){

alert("Select worker");
return;

}



const {error}=await supabase
.from("job_workers")
.insert({

job_id:id,

worker_id:workerId

});



if(error){

alert(error.message);
return;

}



setWorkerId("");

load();


}








async function removeWorker(id:string){


const {error}=await supabase
.from("job_workers")
.delete()
.eq("id",id);



if(error){

alert(error.message);
return;

}


load();


}







return (

<div style={{padding:30}}>


<h1>
Job Workers
</h1>



<select

value={workerId}

onChange={(e)=>setWorkerId(e.target.value)}

>

<option value="">
Select Worker
</option>


{
workers.map(w=>(

<option
key={w.id}
value={w.id}
>

{w.name}

</option>

))

}


</select>



<button
onClick={addWorker}
style={{marginLeft:10}}
>
Assign
</button>





<h2>
Assigned Workers
</h2>




{
assigned.map(a=>(


<div
key={a.id}
style={{
border:"1px solid #ccc",
padding:15,
marginTop:10
}}
>


<h3>
{a.workers?.name}
</h3>


<p>
Phone: {a.workers?.phone}
</p>


<p>
Role: {a.workers?.role}
</p>



<button
onClick={()=>removeWorker(a.id)}
>
Remove
</button>


</div>


))

}



</div>

)

}