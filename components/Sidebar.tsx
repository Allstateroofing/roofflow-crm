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

}=await supabase.auth.getUser();



if(!user) return;



const {data}=await supabase

.from("profiles")

.select("role")

.eq("id",user.id)

.single();



if(data){

setRole(data.role);

}


}





let menu:any[]=[];


// ADMIN

if(role==="admin"){

menu=[

["🏠","Dashboard","/dashboard"],

["👥","Clients","/dashboard/clients"],

["📑","Estimates","/dashboard/estimates"],

["🧾","Invoices","/dashboard/invoices"],

["🏗️","Jobs","/dashboard/jobs"],

["💵","Payments","/dashboard/payments"],

["📊","Reports","/dashboard/reports"],

["👨‍💼","Salesmen","/dashboard/salesmen"],

["👤","Users","/dashboard/users"]

];

}



// SECRETARY

if(role==="secretary"){

menu=[

["🏠","Dashboard","/dashboard"],

["👥","Clients","/dashboard/clients"],

["📑","Estimates","/dashboard/estimates"],

["🧾","Invoices","/dashboard/invoices"],

["🏗️","Jobs","/dashboard/jobs"]

];

}



// SALESMAN

if(role==="salesman"){

menu=[

["🏠","Dashboard","/dashboard"],

["👥","My Clients","/dashboard/clients"],

["📑","My Estimates","/dashboard/estimates"],

["🏗️","My Jobs","/dashboard/jobs"]

];

}



// WORKER

if(role==="worker"){

menu=[

["🏠","Dashboard","/dashboard"],

["🏗️","My Jobs","/dashboard/jobs"]

];

}




if(role==="admin"){


menu.push(

["👨‍💼","Salesmen","/dashboard/salesmen"],

["👤","Users","/dashboard/users"]

);


}





return(


<aside


style={{


width:270,

background:"#111827",

color:"#fff",

position:"fixed",

left:0,

top:0,

bottom:0,

display:"flex",

flexDirection:"column",

borderRight:"1px solid #1F2937"


}}


>



{/* LOGO */}


<div


style={{


padding:25,

borderBottom:"1px solid #1F2937"


}}


>


<div


style={{


display:"flex",

alignItems:"center",

gap:15


}}


>



<img

src="/logo.png"

alt="RoofFlowCRM"

style={{

width:55,

height:55,

objectFit:"contain",

borderRadius:12

}}

/>



<div>


<h2
style={{
margin:0,
fontSize:24,
fontWeight:800,
color:"#FFFFFF"
}}
>
All State Roofing
</h2>



<p
style={{
marginTop:5,
color:"#9CA3AF",
fontSize:13
}}
>
Roofing Management
</p>


</div>


</div>


</div>







{/* MENU */}



<div


style={{


padding:15,

flex:1


}}


>



{

menu.map((item)=>{


const active = pathname === item[2];



return(


<Link


key={item[2]}

href={item[2]}


style={{


display:"flex",

alignItems:"center",

gap:18,


padding:"16px 18px",


marginBottom:10,


borderRadius:12,


textDecoration:"none",


background:

active

?

"#D4AF37"

:

"#1F2937",



color:

active

?

"#111827"

:

"#FFFFFF",



fontWeight:700,


fontSize:16,


transition:"0.2s"


}}


>



<span

style={{

fontSize:20

}}

>

{item[0]}

</span>



<span>

{item[1]}

</span>



</Link>



)


})


}



</div>







{/* LOGOUT */}



<div


style={{


padding:20,

borderTop:"1px solid #374151"


}}


>


<Link


href="/login"


style={{


display:"flex",

alignItems:"center",

gap:15,

padding:14,

borderRadius:10,

textDecoration:"none",

color:"#EF4444",

fontWeight:700


}}


>


🚪 Logout


</Link>



</div>






</aside>



)


}