"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase";


export default function ClientsPage(){


const [clients,setClients]=useState<any[]>([]);
const [search,setSearch]=useState("");
const [salesmen,setSalesmen]=useState<any[]>([]);
const [assignClient,setAssignClient]=useState<any>(null);
const [selectedSalesman,setSelectedSalesman]=useState("");
const [role,setRole]=useState("");

useEffect(()=>{

loadClients();
loadSalesmen();
loadRole();

},[]);




async function loadClients(){


const {data,error}=await supabase
.from("clients")
.select(`
id,
name,
phone,
email,
address,
zip_code,
created_at,


jobs(
id,
status,
total_price,
created_at,

salesman_id,

salesmen(
name
)

)

`)
.order("created_at",{ascending:false});



if(error){

console.log(error);
alert(error.message);
return;

}



const formatted=(data || []).map((client:any)=>{


const jobs = client.jobs || [];


const latestJob = jobs.sort(
(a:any,b:any)=>
new Date(b.created_at).getTime()
-
new Date(a.created_at).getTime()

)[0];



return{

...client,

job:latestJob || null

};


});



setClients(formatted);


}

async function loadSalesmen(){

const {data,error}=await supabase
.from("salesmen")
.select("id,name")
.order("name");


if(error){

console.log(error);
return;

}


setSalesmen(data || []);

}

async function loadRole(){


const {
data:{
user
}

}=await supabase.auth.getUser();



if(!user) return;



const {data,error}=await supabase
.from("profiles")
.select("role")
.eq("id",user.id)
.single();



if(error){

console.log(error);
return;

}



console.log("USER ROLE:", data.role);

setRole(data.role);



}

async function assignSalesman(){


if(!assignClient || !selectedSalesman)
return;



if(!assignClient.job){

alert("Create a job first");
return;

}



const {error}=await supabase
.from("jobs")
.update({

salesman_id:selectedSalesman

})
.eq("id",assignClient.job.id);



if(error){

alert(error.message);
return;

}



setAssignClient(null);
setSelectedSalesman("");

loadClients();

}








async function deleteClient(id:string){


if(!confirm("Delete this client?"))
return;



const {error}=await supabase
.from("clients")
.delete()
.eq("id",id);



if(error){

alert(error.message);
return;

}



loadClients();


}



function getZipColor(zip:string){

if(!zip)
return "#FFFFFF";


const zone = String(zip).substring(0,2);


const colors:any={

"07":"#FEF3C7", // Verdhe

"08":"#DBEAFE", // Blu

"17":"#DCFCE7", // Jeshile

"18":"#EDE9FE", // Lejla

"19":"#E5E7EB"  // Gri


};


return colors[zone] || "#FFFFFF";

}


const filteredClients = clients.filter((client)=>{


const text=search.toLowerCase();



return(

client.name?.toLowerCase().includes(text) ||

client.phone?.toLowerCase().includes(text) ||

client.address?.toLowerCase().includes(text)

);


});







return(


<div

style={{

padding:30

}}

>



<div

style={{

display:"flex",
justifyContent:"space-between",
alignItems:"center"

}}

>


<div>

<h1

style={{

fontSize:32,
fontWeight:800,
color:"#111827"

}}

>

Clients

</h1>


<p

style={{

color:"#6B7280"

}}

>

Manage your customers and roofing projects

</p>


</div>



<Link href="/dashboard/clients/new">


<button

style={{

background:"#D4AF37",
border:0,
padding:"12px 22px",
borderRadius:10,
fontWeight:700,
cursor:"pointer"

}}

>

+ New Client

</button>


</Link>


</div>





<input


placeholder="Search client..."


value={search}


onChange={(e)=>setSearch(e.target.value)}


style={{


marginTop:25,

padding:12,

width:350,

borderRadius:8,

border:"1px solid #D1D5DB"


}}



/>







<div

style={{

marginTop:30,

background:"#fff",

borderRadius:16,

border:"1px solid #E5E7EB",

overflowX:"auto"

}}

>



<table

style={{

width:"100%",
borderCollapse:"collapse",
minWidth:900

}}

>


<thead>


<tr

style={{

background:"#111827",
color:"#D4AF37"

}}

>


<th style={{padding:15,textAlign:"left"}}>
Client
</th>


<th style={{padding:15,textAlign:"left"}}>
Address
</th>


<th style={{padding:15,textAlign:"left"}}>
Phone
</th>

<th style={{padding:15,textAlign:"left"}}>
ZIP Code
</th>

<th style={{padding:15,textAlign:"left"}}>
Salesman
</th>


<th style={{padding:15,textAlign:"left"}}>
Price
</th>


<th style={{padding:15,textAlign:"left"}}>
Status
</th>


<th style={{padding:15,textAlign:"left"}}>
Date
</th>


<th style={{padding:15,textAlign:"left"}}>
Action
</th>



</tr>


</thead>





<tbody>


{

filteredClients.map((client:any)=>(


<tr

key={client.id}

style={{

borderBottom:"1px solid #E5E7EB"

}}

>


<td

style={{

padding:15,
fontWeight:700,
color:"#111827"

}}

>

{client.name}

</td>



<td style={{padding:15}}>

{client.address || "-"}

</td>



<td style={{padding:15}}>

{client.phone || "-"}

</td>

<td

style={{

padding:15,
fontWeight:700,
background:getZipColor(client.zip_code),
borderRadius:8

}}

>

{client.zip_code || "-"}

</td>


<td style={{padding:15}}>


{

client.job?.salesmen?.name ||

"Not Assigned"

}


</td>





<td style={{padding:15,fontWeight:700}}>


{

client.job?.total_price

?

"$"+Number(client.job.total_price).toLocaleString()

:

"-"

}


</td>





<td style={{padding:15}}>


<span

style={{


padding:"6px 12px",

borderRadius:20,

background:"#FEF3C7",

fontSize:13,

fontWeight:600


}}

>

{

client.job?.status || "New"

}


</span>


</td>






<td style={{padding:15}}>


{

new Date(client.created_at)
.toLocaleDateString()

}


</td>





<td style={{padding:15}}>


<Link href={`/dashboard/clients/${client.id}`}>


<button

style={{

padding:"8px 14px",
borderRadius:8,
border:0,
background:"#111827",
color:"#fff",
fontWeight:600

}}

>

View

</button>


</Link>


{
role==="admin" && (

<button

onClick={()=>setAssignClient(client)}

style={{

marginLeft:8,
padding:"8px 14px",
borderRadius:8,
border:0,
background:"#D4AF37",
fontWeight:700

}}

>

Assign

</button>

)

}


{
role==="admin" && (

<button

onClick={()=>deleteClient(client.id)}

style={{

marginLeft:8,

padding:"8px 14px",

borderRadius:8,

border:0,

background:"#DC2626",

color:"#fff"

}}

>

Delete

</button>

)

}



</td>



</tr>



))


}


</tbody>


</table>


</div>


{
assignClient && (

<div

style={{

position:"fixed",
top:0,
left:0,
right:0,
bottom:0,
background:"rgba(0,0,0,.4)",
display:"flex",
alignItems:"center",
justifyContent:"center"

}}

>

<div

style={{

background:"#fff",
padding:30,
borderRadius:15

}}

>

<h3>
Assign Salesman
</h3>


<select

value={selectedSalesman}

onChange={(e)=>setSelectedSalesman(e.target.value)}

>

<option value="">
Select Salesman
</option>


{

salesmen.map((s)=>(

<option key={s.id} value={s.id}>

{s.name}

</option>

))

}


</select>


<br/><br/>


<button

onClick={assignSalesman}

>

Save

</button>


</div>

</div>

)

}


</div>

);


}