"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";


export default function NewSalesmanPage(){

const router = useRouter();


const [name,setName]=useState("");
const [phone,setPhone]=useState("");
const [email,setEmail]=useState("");
const [commission,setCommission]=useState(15);



async function saveSalesman(){


if(!name){

alert("Salesman name is required");
return;

}


const {error}=await supabase
.from("salesmen")
.insert({

name,
phone,
email,
commission_percent:commission

});



if(error){

alert(error.message);
return;

}


alert("Salesman created!");

router.push("/dashboard/salesmen");


}



return (

<div style={{padding:30}}>


<h1>
New Salesman
</h1>



<input

placeholder="Salesman Name"

value={name}

onChange={(e)=>setName(e.target.value)}

style={{
display:"block",
marginBottom:10,
padding:8,
width:300
}}

/>




<input

placeholder="Phone"

value={phone}

onChange={(e)=>setPhone(e.target.value)}

style={{
display:"block",
marginBottom:10,
padding:8,
width:300
}}

/>




<input

placeholder="Email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

style={{
display:"block",
marginBottom:10,
padding:8,
width:300
}}

/>




<input

type="number"

placeholder="Commission %"

value={commission}

onChange={(e)=>setCommission(Number(e.target.value))}

style={{
display:"block",
marginBottom:10,
padding:8,
width:300
}}

/>




<button

onClick={saveSalesman}

style={{
padding:10
}}

>

Save Salesman

</button>



</div>

);


}