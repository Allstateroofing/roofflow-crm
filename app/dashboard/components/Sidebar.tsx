"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {

const pathname = usePathname();

const [role,setRole] = useState("");



useEffect(()=>{

loadRole();

},[]);



async function loadRole(){

const {
data:{
user
}

}= await supabase.auth.getUser();


if(!user) return;


const {data,error}=await supabase
.from("profiles")
.select("role")
.eq("id",user.id)
.single();


if(error){

console.log(error.message);
return;

}


if(data){

setRole(data.role);

}


}




const menu=[


{
name:"Dashboard",
path:"/dashboard",
show:true
},


{
name:"Clients",
path:"/dashboard/clients",
show:true
},


{
name:"Estimates",
path:"/dashboard/estimates",
show:true
},


{
name:"Invoices",
path:"/dashboard/invoices",
show:true
},


{
name:"Jobs",
path:"/dashboard/jobs",
show:true
},


{
name:"Salesmen",
path:"/dashboard/salesmen",
show: role==="admin"
},


{
name:"Payments",
path:"/dashboard/payments",
show: role==="admin"
},


{
name:"Reports",
path:"/dashboard/reports",
show: role==="admin"
},


{
name:"Users",
path:"/dashboard/users",
show: role==="admin"
}



];





return (

<div

style={{

width:240,
minHeight:"100vh",
background:"#111827",
color:"white",
padding:20

}}

>


<h2

style={{

marginBottom:25

}}

>

🏠 RoofFlowCRM

</h2>



<hr />



<div style={{marginTop:20}}>


{

menu
.filter(item=>item.show)
.map(item=>(


<Link

key={item.path}

href={item.path}


style={{

display:"block",
padding:"12px 15px",
marginBottom:8,
borderRadius:8,
textDecoration:"none",

color:"white",

background:
pathname===item.path
?
"#D4AF37"
:
"transparent"


}}


>


{item.name}


</Link>



))


}



</div>




<hr

style={{

margin:"25px 0"

}}

/>



<Link

href="/login"

style={{

color:"white",
textDecoration:"none"

}}

>

Logout

</Link>




</div>


)

}