"use client";

import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "@/lib/supabase";


export default function NewJobPage(){

const router=useRouter();


const [clients,setClients]=useState<any[]>([]);
const [salesmen,setSalesmen]=useState<any[]>([]);


const [clientId,setClientId]=useState("");
const [salesmanId,setSalesmanId]=useState("");

const [status,setStatus]=useState("new");
const [date,setDate]=useState("");
const [price,setPrice]=useState("");
const [notes,setNotes]=useState("");



useEffect(()=>{

load();

},[]);



async function load(){


const {data:c}=await supabase
.from("clients")
.select("id,name")
.order("name");


setClients(c || []);




const {data:s}=await supabase
.from("salesmen")
.select("id,name,commission_percent")
.order("name");


setSalesmen(s || []);


}







async function createJob(){


if(!clientId){

alert("Select client");
return;

}


if(!salesmanId){

alert("Select salesman");
return;

}


if(Number(price)<=0){

alert("Enter valid price");
return;

}



const {error}=await supabase
.from("jobs")
.insert({

client_id:clientId,

salesman_id:salesmanId,

status,

scheduled_date:date || null,

total_price:Number(price),

profit:0,

notes


});



if(error){

alert(error.message);
return;

}



router.push("/dashboard/jobs");


}





return (

<div style={{padding:30}}>


<h1>
Create Job
</h1>



<h3>Client</h3>


<select

value={clientId}

onChange={(e)=>setClientId(e.target.value)}

>


<option value="">
Select Client
</option>


{
clients.map(c=>(

<option
key={c.id}
value={c.id}
>

{c.name}

</option>

))
}


</select>





<h3>Salesman</h3>


<select

value={salesmanId}

onChange={(e)=>setSalesmanId(e.target.value)}

>


<option value="">
Select Salesman
</option>


{
salesmen.map(s=>(

<option
key={s.id}
value={s.id}
>

{s.name}

</option>

))
}


</select>






<h3>Status</h3>


<select

value={status}

onChange={(e)=>setStatus(e.target.value)}

>


<option value="new">
New
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





<h3>Date</h3>


<input

type="date"

value={date}

onChange={(e)=>setDate(e.target.value)}

/>





<h3>Total Price</h3>


<input

type="number"

value={price}

onChange={(e)=>setPrice(e.target.value)}

placeholder="15000"

/>





<h3>Notes</h3>


<textarea

value={notes}

onChange={(e)=>setNotes(e.target.value)}

/>





<br/><br/>


<button onClick={createJob}>

Create Job

</button>



</div>

)

}