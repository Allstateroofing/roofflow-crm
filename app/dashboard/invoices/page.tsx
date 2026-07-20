"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";


export default function InvoicesPage(){


const [invoices,setInvoices]=useState<any[]>([]);



useEffect(()=>{

loadInvoices();

},[]);





async function loadInvoices(){


const {data,error}=await supabase
.from("invoices")
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


setInvoices(data || []);


}





return(

<div style={{padding:30}}>


<h1>
Invoices
</h1>



<Link href="/dashboard/invoices/new">

<button>
+ New Invoice
</button>

</Link>



<hr/>



{
invoices.map(invoice=>(


<div

key={invoice.id}

style={{

border:"1px solid #ddd",
padding:20,
marginTop:15,
borderRadius:10

}}

>


<h2>

Invoice

</h2>



<p>
Client:

{
invoice.jobs?.clients?.name || "-"
}

</p>



<p>
Amount:

$
{
Number(invoice.amount || invoice.jobs?.total_price || 0)
.toLocaleString()
}

</p>



<p>
Status:

{invoice.status}

</p>



<p>
Date:

{
new Date(invoice.created_at)
.toLocaleDateString()
}

</p>



</div>


))

}



</div>

)

}