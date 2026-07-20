"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


export default function PaymentsPage(){

const [payments,setPayments]=useState<any[]>([]);
const [loading,setLoading]=useState(true);


useEffect(()=>{

loadPayments();

},[]);



async function loadPayments(){


const {data,error}=await supabase
.from("payments")
.select(`
*,
jobs(
id,
total_price,
clients(
name
)
)
`)
.order("created_at",{ascending:false});



if(error){

alert(error.message);
return;

}



setPayments(data || []);

setLoading(false);


}




if(loading){

return(
<div style={{padding:30}}>
Loading...
</div>
)

}



return(

<div style={{padding:30}}>


<h1>
Payments
</h1>



<table border={1} cellPadding={10}>


<thead>

<tr>

<th>
Client
</th>

<th>
Amount
</th>

<th>
Method
</th>

<th>
Status
</th>

<th>
Date
</th>

</tr>

</thead>



<tbody>


{
payments.map((p)=>(

<tr key={p.id}>


<td>
{p.jobs?.clients?.[0]?.name || "-"}
</td>


<td>
${Number(p.amount || 0).toLocaleString()}
</td>


<td>
{p.method || "-"}
</td>


<td>
{p.status || "-"}
</td>


<td>
{
p.created_at
?
new Date(p.created_at).toLocaleDateString()
:
"-"
}
</td>



</tr>

))

}



</tbody>


</table>


<br/>


<Link href="/dashboard">
<button>
Back
</button>
</Link>



</div>

)

}