"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


export default function EstimateDetailPage(){

const params = useParams();
const router = useRouter();

const id = String(params.id);


const [estimate,setEstimate]=useState<any>(null);
const [loading,setLoading]=useState(true);



useEffect(()=>{

loadEstimate();

},[]);



async function loadEstimate(){


const {data,error}=await supabase
.from("estimates")
.select(`
*,
clients(
name,
phone,
email,
address
),
salesmen(
name
)
`)
.eq("id",id)
.single();



if(error){

alert(error.message);
return;

}


setEstimate(data);

setLoading(false);

}





async function convertToJob(){


if(!estimate){

return;

}



const {data,error}=await supabase
.from("jobs")
.insert({

client_id:estimate.client_id,

salesman_id:estimate.salesman_id,

estimate_id:estimate.id,

total_price:estimate.total,

status:"approved",

notes:estimate.title


})
.select()
.single();



if(error){

alert(error.message);
return;

}



await supabase
.from("estimates")
.update({

converted_job_id:data.id,

status:"converted"

})
.eq("id",id);



alert("Estimate converted to Job");


router.push(
`/dashboard/jobs/${data.id}`
);


}





if(loading){

return (

<div style={{padding:30}}>
Loading...
</div>

)

}



return (

<div style={{padding:30}}>


<h1>
Estimate Details
</h1>



<div
style={{
border:"1px solid #ccc",
padding:20,
borderRadius:10,
maxWidth:800
}}
>



<h2>
Client
</h2>


<p>
Name:
{estimate.clients?.name}
</p>


<p>
Phone:
{estimate.clients?.phone}
</p>


<p>
Email:
{estimate.clients?.email}
</p>


<p>
Address:
{estimate.clients?.address}
</p>



<hr/>


<h2>
Salesman
</h2>


<p>
{estimate.salesmen?.name || "No salesman"}
</p>



<hr/>


<h2>
Estimate
</h2>


<p>
Title:
{estimate.title}
</p>


<p>
Status:
{estimate.status}
</p>



<h3>
Total:
${Number(estimate.total).toLocaleString()}
</h3>




<hr/>


<h2>
Payment
</h2>


<p>
Deposit Mode:
{estimate.deposit_mode}
</p>


<p>
Deposit:
${estimate.deposit_amount}
</p>


<p>
Paid:
${estimate.paid_amount}
</p>


<p>
Remaining:
${estimate.remaining_amount}
</p>



<hr/>




<h2>
Items
</h2>


<pre>

{
JSON.stringify(
estimate.items,
null,
2
)
}

</pre>




<hr/>




<button
onClick={convertToJob}
style={{
padding:10,
fontSize:16
}}
>

Convert To Job

</button>



<br/><br/>



<button
onClick={()=>router.back()}
>

Back

</button>




</div>


</div>


)

}