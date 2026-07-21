"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


export default function SearchPage(){

const [search,setSearch]=useState("");
const [results,setResults]=useState<any[]>([]);



async function runSearch(){


if(!search.trim()){

setResults([]);

return;

}



let data:any[]=[];



// CLIENTS + ZIP + SALESMAN ID

const {data:clients,error:clientError}=await supabase

.from("clients")

.select(`
*,
salesmen:salesman_id(
name
)
`)

.or(
`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%,zip.ilike.%${search}%`
);


console.log("CLIENTS:",clients);
console.log("CLIENT ERROR:",clientError);



if(clients){

const filteredClients = clients.filter((x:any)=>{

return (

x.name?.toLowerCase().includes(search.toLowerCase()) ||

x.phone?.includes(search) ||

x.email?.toLowerCase().includes(search.toLowerCase()) ||

x.address?.toLowerCase().includes(search.toLowerCase()) ||

x.zip?.includes(search) ||

x.salesmen?.name?.toLowerCase().includes(search.toLowerCase())

);

});


data.push(

...filteredClients.map((x:any)=>({

type:"Client",

name:x.name,

info:
`
Phone: ${x.phone || ""}
Email: ${x.email || ""}
Address: ${x.address || ""}
Zip: ${x.zip || ""}
Salesman: ${x.salesmen?.name || x.salesmen?.[0]?.name || ""}
`

}))

);

}




// SALESMEN

const {data:salesmen}=await supabase

.from("salesmen")

.select("*")

.or(
`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
);



if(salesmen){

data.push(

...salesmen.map((x:any)=>({

type:"Salesman",

name:x.name,

info:
`
Phone: ${x.phone || ""}
Email: ${x.email || ""}
Commission: ${x.commission_percent || ""}%
`

}))

);

}




// JOBS

const {data:jobs}=await supabase

.from("jobs")

.select(`
*,
clients(
name,
phone,
address
),
salesmen(
name
)
`)

.or(
`status.ilike.%${search}%,notes.ilike.%${search}%`
);



if(jobs){

data.push(

...jobs.map((x:any)=>(

{

type:"Job",

name:x.clients?.name || "Job",

info:
`
Status: ${x.status || ""}
Client Phone: ${x.clients?.phone || ""}
Address: ${x.clients?.address || ""}
Salesman: ${x.salesmen?.name || ""}
Notes: ${x.notes || ""}
`

}

))

);

}



setResults(data);


}





return(

<div>


<h1
style={{
fontSize:28,
fontWeight:800,
marginBottom:20
}}
>
Global Search
</h1>



<input

value={search}

onChange={(e)=>setSearch(e.target.value)}

onKeyDown={(e)=>{

if(e.key==="Enter") runSearch();

}}

placeholder="Search name, phone, zip, salesman, job..."

style={{

width:"100%",

padding:15,

border:"1px solid #ddd",

borderRadius:10,

fontSize:16

}}

/>



<button

onClick={runSearch}

style={{

marginTop:15,

padding:"12px 25px",

background:"#D4AF37",

border:"none",

borderRadius:10,

fontWeight:700

}}

>

Search

</button>



<div style={{marginTop:30}}>


{
results.map((r,i)=>(


<div

key={i}

style={{

padding:20,

background:"#fff",

borderRadius:12,

marginBottom:10,

border:"1px solid #ddd"

}}

>


<b>{r.type}</b>


<h3>{r.name}</h3>


<p style={{whiteSpace:"pre-line"}}>

{r.info}

</p>


</div>


))

}


</div>


</div>

)


}