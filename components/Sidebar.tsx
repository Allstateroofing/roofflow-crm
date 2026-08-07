"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export default function Sidebar(){

const pathname = usePathname();
const router = useRouter();

const [role,setRole]=useState("");
const [open,setOpen]=useState(false);



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



async function logout(){

await supabase.auth.signOut();

router.replace("/auth/login");

}




let menu:any[]=[];



if(role==="admin"){

menu=[

["🏠","Dashboard","/dashboard"],

["🔎","Search","/dashboard/search"],

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



if(role==="secretary"){

menu=[

["🏠","Dashboard","/dashboard"],

["🔎","Search","/dashboard/search"],

["👥","Clients","/dashboard/clients"],

["📑","Estimates","/dashboard/estimates"],

["🧾","Invoices","/dashboard/invoices"],

["🏗️","Jobs","/dashboard/jobs"]

];

}



if(role==="salesman"){

menu=[

["🏠","Dashboard","/dashboard"],

["🔎","Search","/dashboard/search"],

["👥","My Clients","/dashboard/clients"],

["📑","My Estimates","/dashboard/estimates"],

["🏗️","My Jobs","/dashboard/jobs"]

];

}



if(role==="worker"){

menu=[

["🏠","Dashboard","/dashboard"],

["🏗️","My Jobs","/dashboard/jobs"]

];

}



return(

<>


<button

onClick={()=>setOpen(!open)}

style={{

position:"fixed",

top:15,

left:15,

zIndex:9999,

width:45,

height:45,

borderRadius:10,

border:"none",

background:"#111827",

color:"#fff",

fontSize:24,

cursor:"pointer"

}}

>

☰

</button>




{

open &&

<div

onClick={()=>setOpen(false)}

style={{

position:"fixed",

inset:0,

background:"rgba(0,0,0,.35)",

zIndex:9998

}}

/>

}




<aside

style={{

width:270,

background:"#111827",

color:"#fff",

position:"fixed",

left:open?0:-270,

top:0,

bottom:0,

transition:".3s",

zIndex:9999,

display:"flex",

flexDirection:"column"

}}

>



<div

style={{

padding:25,

borderBottom:"1px solid #374151"

}}

>


<img

src="/logo.png"

style={{

width:60,

height:60,

borderRadius:12

}}

/>



<h2

style={{

marginTop:15,

marginBottom:5

}}

>

All State Roofing

</h2>



<p

style={{

color:"#9CA3AF",

margin:0

}}

>

Roofing & Chimney Management

</p>


</div>





<div

style={{

flex:1,

padding:15

}}

>


{

menu.map((item)=>{


const active=pathname===item[2];


return(

<Link

key={item[2]}

href={item[2]}

onClick={()=>setOpen(false)}

style={{

display:"flex",

alignItems:"center",

gap:15,

padding:16,

marginBottom:10,

borderRadius:12,

textDecoration:"none",

background:active?"#D4AF37":"#1F2937",

color:active?"#111827":"white",

fontWeight:700

}}

>


<span>

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





<div

style={{

padding:20,

borderTop:"1px solid #374151"

}}

>


<button

onClick={logout}

style={{

background:"transparent",

border:"none",

color:"#EF4444",

fontWeight:700,

fontSize:16,

cursor:"pointer",

padding:0

}}

>

🚪 Logout

</button>


</div>




</aside>


</>

)

}