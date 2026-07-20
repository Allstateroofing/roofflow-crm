"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


export default function NewPayment(){

const router = useRouter();


const [invoices,setInvoices] = useState<any[]>([]);

const [invoice,setInvoice] = useState<string | null>(null);

const [amount,setAmount] = useState("");

const [method,setMethod] = useState("Cash");



useEffect(()=>{

loadInvoices();

},[]);




async function loadInvoices(){

const {data,error}=await supabase
.from("invoices")
.select(`
id,
number,
clients(
name
)
`);


if(error){

alert(error.message);
return;

}


setInvoices(data || []);

}





async function savePayment(){


if(!invoice){

alert("Please select invoice");

return;

}



if(!amount || Number(amount)<=0){

alert("Enter valid amount");

return;

}




const {error}=await supabase
.from("payments")
.insert({

invoice_id: invoice,

amount:Number(amount),

method,

status:"paid"

});



if(error){

alert(error.message);

return;

}



router.push("/dashboard/payments");


}





return(

<div style={{padding:30}}>


<h1>
Add Payment
</h1>



<select

value={invoice || ""}

onChange={(e)=>setInvoice(e.target.value || null)}

>


<option value="">
Select Invoice
</option>



{
invoices.map((i)=>(

<option

key={i.id}

value={i.id}

>

#{i.number} - {i.clients?.name}

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

value={method}

onChange={(e)=>setMethod(e.target.value)}

>

<option>
Cash
</option>

<option>
Check
</option>

<option>
Card
</option>

<option>
Bank
</option>


</select>



<br/><br/>



<button

onClick={savePayment}

>

Save Payment

</button>



</div>

)

}