"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";


export default function NewClientPage(){

const router = useRouter();


const [name,setName]=useState("");
const [phone,setPhone]=useState("");
const [email,setEmail]=useState("");
const [address,setAddress]=useState("");
const [zipCode,setZipCode]=useState("");



async function saveClient(){


if(!name){

alert("Client name is required");
return;

}



const {error}=await supabase
.from("clients")
.insert({

name,

phone,

email,

address,

zip_code:zipCode

});



if(error){

alert(error.message);
return;

}



alert("Client created!");

router.push("/dashboard/clients");


}





return (

<div style={{padding:30}}>


<h1>
New Client
</h1>



<input

placeholder="Client Name"

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

placeholder="Address"

value={address}

onChange={(e)=>setAddress(e.target.value)}

style={{
display:"block",
marginBottom:10,
padding:8,
width:300
}}

/>
<input

placeholder="ZIP Code"

value={zipCode}

onChange={(e)=>setZipCode(e.target.value)}

style={{
display:"block",
marginBottom:10,
padding:8,
width:300
}}

/>


<button

onClick={saveClient}

style={{
padding:10
}}

>

Save Client

</button>



</div>

);


}