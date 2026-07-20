"use client";

import Link from "next/link";
import {
LayoutDashboard,
Users,
Briefcase,
FileText,
UserRound,
Settings,
DollarSign
} from "lucide-react";


export default function Sidebar(){

const menu=[

{
name:"Dashboard",
href:"/dashboard",
icon:LayoutDashboard
},

{
name:"Clients",
href:"/dashboard/clients",
icon:Users
},

{
name:"Jobs",
href:"/dashboard/jobs",
icon:Briefcase
},

{
name:"Estimates",
href:"/dashboard/estimates",
icon:FileText
},

{
name:"Salesmen",
href:"/dashboard/salesmen",
icon:UserRound
},

{
name:"Commissions",
href:"/dashboard/commissions",
icon:DollarSign
},

{
name:"Settings",
href:"#",
icon:Settings
}

];


return(

<aside

style={{

width:260,
minHeight:"100vh",
background:"#111827",
color:"white",
padding:"25px 20px",
position:"fixed",
left:0,
top:0

}}

>


<div

style={{

display:"flex",
alignItems:"center",
gap:12,
marginBottom:40

}}

>


<div

style={{

width:45,
height:45,
borderRadius:12,
background:"#D4AF37",
display:"flex",
alignItems:"center",
justifyContent:"center",
fontSize:24

}}

>
🏠
</div>


<div>

<h2

style={{

fontSize:20,
fontWeight:800

}}

>
RoofFlow
</h2>

<p

style={{

fontSize:12,
color:"#94A3B8"

}}

>
CRM System
</p>


</div>


</div>



<nav

style={{

display:"flex",
flexDirection:"column",
gap:8

}}

>


{
menu.map(item=>{


const Icon=item.icon;


return(

<Link

key={item.name}

href={item.href}

style={{

display:"flex",
alignItems:"center",
gap:14,
padding:"12px 15px",
borderRadius:12,
color:"#E5E7EB",
textDecoration:"none",
fontSize:15,
fontWeight:600

}}

>


<Icon size={20}/>

{item.name}


</Link>


)


})

}


</nav>



</aside>


)

}