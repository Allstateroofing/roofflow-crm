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



// CLIENTS

const {data:clients,error:clientError}=await supabase
.from("clients")
.select("*")
.or(
`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%,address.ilike.%${search}%`
);


console.log("CLIENT RESULTS",clients);
console.log("CLIENT ERROR",clientError);



if(clients){

data.push(
...clients.map((x:any)=>({

type:"Client",

name:x.name,

info:
`${x.phone || ""} ${x.email || ""} ${x.address || ""}`

}))
);

}




// SALESMEN

const {data:salesmen,error:salesError}=await supabase
.from("salesmen")
.select("*")
.or(
`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
);


console.log("SALESMAN RESULTS",salesmen);
console.log("SALESMAN ERROR",salesError);



if(salesmen){

data.push(
...salesmen.map((x:any)=>({

type:"Salesman",

name:x.name,

info:
`${x.phone || ""} ${x.email || ""}`

}))
);

}




// JOBS

const {data:jobs,error:jobError}=await supabase
.from("jobs")
.select("*")
.or(
`status.ilike.%${search}%,notes.ilike.%${search}%`
);


console.log("JOB RESULTS",jobs);
console.log("JOB ERROR",jobError);



if(jobs){

data.push(
...jobs.map((x:any)=>({

type:"Job",

name:"Job",

info:
`${x.status || ""} ${x.notes || ""}`

}))
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

placeholder="Search client, phone, zip, salesman, job..."

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

fontWeight:700,

cursor:"pointer"

}}

>

Search

</button>




<div

style={{

marginTop:30

}}

>


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


<b>

{r.type}

</b>


<h3>

{r.name}

</h3>


<p>

{r.info}

</p>



</div>


))

}



</div>



</div>


)

}