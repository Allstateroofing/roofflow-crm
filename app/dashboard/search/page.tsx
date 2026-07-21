"use client";

import {useState} from "react";
import {supabase} from "@/lib/supabase";


export default function SearchPage(){


const [search,setSearch]=useState("");

const [results,setResults]=useState<any[]>([]);


async function runSearch(){


if(!search){

setResults([]);

return;

}



const text=search.toLowerCase();



const {data:clients}=await supabase

.from("clients")

.select(`
*,
salesmen(name)
`);



const {data:jobs}=await supabase

.from("jobs")

.select(`
*,
clients(name,phone,address,email),
salesmen(name)
`);




let found:any[]=[];



clients?.forEach((c:any)=>{


const value=`

${c.name}
${c.phone}
${c.email}
${c.address}
${c.salesmen?.name}

`.toLowerCase();



if(value.includes(text)){


found.push({

type:"Client",

name:c.name,

info:c.phone+" "+c.address

});


}


});





jobs?.forEach((j:any)=>{


const value=`

${j.notes}
${j.status}
${j.clients?.name}
${j.clients?.phone}
${j.clients?.address}
${j.salesmen?.name}

`.toLowerCase();



if(value.includes(text)){


found.push({

type:"Job",

name:j.clients?.name,

info:
j.status+
" | "+
j.salesmen?.name

});


}


});



setResults(found);


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



<div
style={{
display:"flex",
gap:10
}}
>


<input

placeholder="Search name, phone, zip, salesman, job..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

style={{

padding:15,

width:"100%",

border:"1px solid #ddd",

borderRadius:10

}}

/>


<button

onClick={runSearch}

style={{

background:"#D4AF37",

padding:"0 25px",

borderRadius:10,

fontWeight:700

}}

>

Search

</button>


</div>




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

background:"#fff",

padding:20,

marginBottom:10,

borderRadius:12,

border:"1px solid #eee"

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