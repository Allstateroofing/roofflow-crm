"use client";

import {useEffect,useState} from "react";
import {useSearchParams,useRouter} from "next/navigation";
import {supabase} from "@/lib/supabase";


export default function NewJobPage(){


const router = useRouter();

const searchParams = useSearchParams();

const clientId = searchParams.get("client");


const [client,setClient]=useState<any>(null);

const [salesmen,setSalesmen]=useState<any[]>([]);


const [salesman,setSalesman]=useState("");

const [status,setStatus]=useState("new");

const [price,setPrice]=useState("");

const [date,setDate]=useState("");

const [notes,setNotes]=useState("");



useEffect(()=>{

if(clientId){
loadClient();
}

loadSalesmen();


},[clientId]);





async function loadClient(){


const {data,error}=await supabase

.from("clients")

.select("*")

.eq("id",clientId)

.single();



if(error){

alert(error.message);
return;

}


setClient(data);


}





async function loadSalesmen(){


const {data,error}=await supabase

.from("salesmen")

.select("id,name")

.order("name");


if(error){

console.log(error);
return;

}


setSalesmen(data || []);


}





async function saveJob(){


if(!client){

alert("Client not loaded");

return;

}



const {error}=await supabase

.from("jobs")

.insert({

client_id:client.id,

salesman_id:salesman || null,

status,

total_price:Number(price || 0),

scheduled_date:date || null,

notes

});




if(error){

alert(error.message);

return;

}



alert("Job Created");


router.push(`/dashboard/clients/${clientId}`);


}





return(


<div style={{padding:30}}>


<h1>

Create Job

</h1>




{
client &&

<div

style={{

background:"#fff",

padding:20,

borderRadius:15,

marginBottom:20

}}

>


<h2>

Client Information

</h2>


<p>
<b>Name:</b> {client.name}
</p>


<p>
<b>Phone:</b> {client.phone}
</p>


<p>
<b>Email:</b> {client.email}
</p>


<p>
<b>Address:</b> {client.address}
</p>


<p>
<b>ZIP:</b> {client.zip_code}
</p>


</div>

}





<div

style={{

background:"#fff",

padding:25,

borderRadius:15

}}

>


<h2>

Job Details

</h2>



<label>
Salesman
</label>


<br/>


<select

value={salesman}

onChange={(e)=>setSalesman(e.target.value)}

style={{

padding:10,
width:300

}}

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



<br/><br/>





<label>
Status
</label>


<br/>


<select

value={status}

onChange={(e)=>setStatus(e.target.value)}

style={{

padding:10,
width:300

}}

>


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




<br/><br/>




<input

placeholder="Job Price"

value={price}

onChange={(e)=>setPrice(e.target.value)}

style={{

padding:10,
width:300

}}

/>



<br/><br/>




<input

type="date"

value={date}

onChange={(e)=>setDate(e.target.value)}

style={{

padding:10,
width:300

}}

/>



<br/><br/>





<textarea

placeholder="Job Notes"

value={notes}

onChange={(e)=>setNotes(e.target.value)}

style={{

width:300,

height:100,

padding:10

}}

/>



<br/><br/>




<button

onClick={saveJob}

style={{

background:"#D4AF37",

padding:"12px 25px",

border:0,

borderRadius:10,

fontWeight:700

}}

>

Save Job

</button>



</div>


</div>


)


}