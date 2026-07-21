"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SearchPage() {

const [q,setQ]=useState("");

const [clients,setClients]=useState<any[]>([]);
const [jobs,setJobs]=useState<any[]>([]);
const [estimates,setEstimates]=useState<any[]>([]);

useEffect(()=>{

if(q.length<2){

setClients([]);
setJobs([]);
setEstimates([]);
return;

}

search();

},[q]);

async function search(){

const term=`%${q}%`;

const {data:clientsData}=await supabase
.from("clients")
.select("*")
.or(`
name.ilike.${term},
phone.ilike.${term},
email.ilike.${term},
address.ilike.${term},
city.ilike.${term},
state.ilike.${term},
zip.ilike.${term},
salesman_name.ilike.${term}
`);

setClients(clientsData || []);

const {data:jobsData}=await supabase
.from("jobs")
.select("*")
.or(`
status.ilike.${term},
notes.ilike.${term},
address.ilike.${term}
`);

setJobs(jobsData || []);

const {data:estimatesData}=await supabase
.from("estimates")
.select("*")
.or(`
title.ilike.${term},
status.ilike.${term}
`);

setEstimates(estimatesData || []);

}

return(

<div>

<h1>Global Search</h1>

<input

value={q}

onChange={(e)=>setQ(e.target.value)}

placeholder="Search client, phone, zip, salesman..."

style={{
width:"100%",
padding:15,
fontSize:18,
borderRadius:10,
border:"1px solid #ddd"
}}

/>

<br/><br/>

<h2>Clients ({clients.length})</h2>

{
clients.map(c=>

<div
key={c.id}
style={{
padding:15,
border:"1px solid #ddd",
marginBottom:10
}}
>

<b>{c.name}</b>

<br/>

{c.phone}

<br/>

{c.address}

<br/>

ZIP: {c.zip}

</div>

)
}

<h2>Jobs ({jobs.length})</h2>

{
jobs.map(j=>

<div
key={j.id}
style={{
padding:15,
border:"1px solid #ddd",
marginBottom:10
}}
>

<b>{j.status}</b>

<br/>

{j.notes}

</div>

)
}

<h2>Estimates ({estimates.length})</h2>

{
estimates.map(e=>

<div
key={e.id}
style={{
padding:15,
border:"1px solid #ddd",
marginBottom:10
}}
>

<b>{e.title}</b>

<br/>

${e.total}

</div>

)
}

</div>

);

}