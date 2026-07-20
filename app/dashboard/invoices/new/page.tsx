"use client";


import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "@/lib/supabase";



export default function NewInvoice(){


const router=useRouter();


const [jobs,setJobs]=useState<any[]>([]);

const [jobId,setJobId]=useState("");

const [amount,setAmount]=useState("");

const [status,setStatus]=useState("Draft");

const [notes,setNotes]=useState("");





useEffect(()=>{

loadJobs();

},[]);







async function loadJobs(){


const {data,error}=await supabase
.from("jobs")
.select(`
id,
total_price,
clients(
name
)
`)
.order("created_at",{ascending:false});



if(error){

alert(error.message);

return;

}



setJobs(data || []);


}







function selectJob(value:string){


setJobId(value);


const job=jobs.find(
(j)=>j.id===value
);



if(job){

setAmount(
String(job.total_price || 0)
);

}


}







async function createInvoice(){


if(!jobId){

alert("Select Job");

return;

}




const {error}=await supabase
.from("invoices")
.insert({

job_id:jobId,

amount:Number(amount),

status,

notes

});



if(error){

alert(error.message);

return;

}



alert("Invoice Created");


router.push("/dashboard/invoices");


}








return(

<div style={{padding:30}}>


<h1>
Create Invoice
</h1>



<h3>
Select Job
</h3>



<select

value={jobId}

onChange={(e)=>selectJob(e.target.value)}

>


<option value="">
Choose Job
</option>



{
jobs.map(j=>(


<option

key={j.id}

value={j.id}

>


{j.clients?.[0]?.name}
-
$
{j.total_price}


</option>


))

}


</select>






<br/><br/>





<input

type="number"

placeholder="Amount"

value={amount}

onChange={(e)=>setAmount(e.target.value)}

/>





<br/><br/>





<select

value={status}

onChange={(e)=>setStatus(e.target.value)}

>


<option>
Draft
</option>


<option>
Sent
</option>


<option>
Paid
</option>


</select>







<br/><br/>





<textarea

rows={5}

placeholder="Notes"

value={notes}

onChange={(e)=>setNotes(e.target.value)}

/>







<br/><br/>





<button

onClick={createInvoice}

>

Create Invoice

</button>






<br/><br/>





<button

onClick={()=>router.push("/dashboard/invoices")}

>

Back

</button>





</div>

)


}