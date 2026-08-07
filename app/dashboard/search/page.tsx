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


// GET CLIENTS

const {data:clients,error:clientError}=await supabase
.from("clients")
.select("*");


// GET SALESMEN

const {data:salesmen,error:salesmanError}=await supabase
.from("salesmen")
.select("*");



console.log("CLIENTS:",clients);
console.log("SALESMEN:",salesmen);
console.log("CLIENT ERROR:",clientError);
console.log("SALESMAN ERROR:",salesmanError);



if(clients){


const filteredClients = clients.filter((c:any)=>{


const salesman = salesmen?.find(
(s:any)=>s.id === c.salesman_id
);


return (

c.name?.toLowerCase()
.includes(search.toLowerCase()) ||

c.phone?.includes(search) ||

c.email?.toLowerCase()
.includes(search.toLowerCase()) ||

c.address?.toLowerCase()
.includes(search.toLowerCase()) ||

c.zip?.includes(search) ||

salesman?.name?.toLowerCase()
.includes(search.toLowerCase())

);


});



data.push(

...filteredClients.map((c:any)=>{


const salesman = salesmen?.find(
(s:any)=>s.id === c.salesman_id
);


return {

type:"Client",

name:c.name,

info:
`
Phone: ${c.phone || ""}
Email: ${c.email || ""}
Address: ${c.address || ""}
Zip: ${c.zip || ""}
Salesman: ${salesman?.name || ""}
`

};


})

);


}





// SALESMAN SEARCH


if(salesmen){


const filteredSalesmen=salesmen.filter((s:any)=>{


return (

s.name?.toLowerCase()
.includes(search.toLowerCase()) ||

s.phone?.includes(search) ||

s.email?.toLowerCase()
.includes(search.toLowerCase())

);


});



data.push(

...filteredSalesmen.map((s:any)=>({

type:"Salesman",

name:s.name,

info:
`
Phone: ${s.phone || ""}
Email: ${s.email || ""}
Commission: ${s.commission_percent || ""}%
`

}))


);


}





// JOBS


const {data:jobs}=await supabase
.from("jobs")
.select("*");



if(jobs){


const filteredJobs=jobs.filter((j:any)=>{


return (

j.status?.toLowerCase()
.includes(search.toLowerCase()) ||

j.notes?.toLowerCase()
.includes(search.toLowerCase())

);


});



data.push(

...filteredJobs.map((j:any)=>({

type:"Job",

name:"Job",

info:
`
Status: ${j.status || ""}
Notes: ${j.notes || ""}
`

}))


);


}



setResults(data);


}




return (

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

if(e.key==="Enter")
runSearch();

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

);


}