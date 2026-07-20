"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";


export default function SalesmenPage(){

const [salesmen,setSalesmen]=useState<any[]>([]);
const [search,setSearch]=useState("");



useEffect(()=>{

loadSalesmen();

},[]);




async function loadSalesmen(){


const {data,error}=await supabase
.from("salesmen")
.select("*")
.order("created_at",{ascending:false});



if(error){

alert(error.message);
return;

}


setSalesmen(data || []);


}





async function deleteSalesman(id:string){


const ok=confirm(
"Delete this salesman?"
);



if(!ok) return;



const {error}=await supabase
.from("salesmen")
.delete()
.eq("id",id);



if(error){

alert(error.message);
return;

}



loadSalesmen();


}




const filteredSalesmen =
salesmen.filter((s)=>

s.name
?.toLowerCase()
.includes(
search.toLowerCase()
)

);





return (

<div style={{padding:30}}>


<h1>
Salesmen
</h1>



<Link href="/dashboard/salesmen/new">

<button>
+ New Salesman
</button>

</Link>



<br/><br/>



<input

placeholder="Search salesman..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

style={{
padding:8,
width:300
}}

/>



<hr/>



{
filteredSalesmen.map((salesman)=>(


<div

key={salesman.id}

style={{

border:"1px solid #ccc",

padding:20,

marginTop:15,

borderRadius:10

}}

>


<h2>
{salesman.name}
</h2>


<p>
Phone: {salesman.phone}
</p>



<p>
Email: {salesman.email}
</p>



<p>
Commission:
{salesman.commission_percent}%
</p>




<Link href={`/dashboard/salesmen/${salesman.id}`}>

<button>
View / Edit
</button>

</Link>




<button

onClick={()=>deleteSalesman(salesman.id)}

style={{
marginLeft:10
}}

>

Delete

</button>



</div>


))

}



</div>


);


}