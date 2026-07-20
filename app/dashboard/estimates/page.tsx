"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


export default function EstimatesPage() {


const [estimates,setEstimates]=useState<any[]>([]);



useEffect(()=>{

loadEstimates();

},[]);




async function loadEstimates(){


const {data,error}=await supabase

.from("estimates")

.select(`
id,
title,
items,
total,
status,
deposit_amount,
paid_amount,
remaining_amount,
created_at,
clients!estimates_client_id_fkey(
name,
phone,
address
)
`)

.order("created_at",{
ascending:false
});



if(error){

alert(error.message);
return;

}



setEstimates(data || []);



}





return (

<div style={{padding:30}}>


<h1>
Estimates
</h1>



<Link href="/dashboard/estimates/new">

<button>
Create New Estimate
</button>

</Link>



<hr/>



{
estimates.length===0 && (

<p>
No estimates found
</p>

)

}




{
estimates.map((estimate)=>(


<div

key={estimate.id}

style={{
border:"1px solid #ccc",
padding:20,
marginTop:15,
borderRadius:10
}}

>



<h2>
{estimate.title}
</h2>



<p>
Client:
{" "}
{estimate.clients?.name || "No Client"}
</p>



<p>
Phone:
{" "}
{estimate.clients?.phone}
</p>



<p>
Address:
{" "}
{estimate.clients?.address}
</p>



<hr/>



<h3>
Items
</h3>



{
estimate.items?.map(
(item:any,index:number)=>(

<p key={index}>

{item.name}

<br/>

Qty:
{item.qty}

<br/>

Price:
${item.price}

</p>

)

)

}




<hr/>



<h3>

Total:
${estimate.total || 0}

</h3>



<p>

Deposit:
${estimate.deposit_amount || 0}

</p>



<p>

Paid:
${estimate.paid_amount || 0}

</p>



<p>

Remaining:
${estimate.remaining_amount || 0}

</p>




<p>

Status:
<b>
{" "}
{estimate.status}
</b>

</p>




<Link href={`/dashboard/estimates/${estimate.id}`}>

<button>

View Estimate

</button>

</Link>



</div>


))

}



</div>

);


}