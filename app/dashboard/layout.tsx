"use client";

import Sidebar from "@/components/Sidebar";


export default function DashboardLayout({

children

}:{

children:React.ReactNode

}){


return(

<div

style={{

display:"flex",
minHeight:"100vh",
background:"#F8FAFC"

}}

>


<Sidebar />


<div

style={{
  flex:1,
  display:"flex",
  flexDirection:"column",
  marginLeft:0
}}

>


<header

style={{

height:70,
background:"#ffffff",
borderBottom:"1px solid #e5e7eb",
display:"flex",
alignItems:"center",
justifyContent:"space-between",
padding:"0 30px"

}}

>


<div>

<h2

style={{

margin:0,
fontSize:22,
fontWeight:800,
color:"#111827"

}}

>

RoofFlowCRM

</h2>


<p

style={{

margin:0,
fontSize:12,
color:"#6b7280"

}}

>

Roofing Management

</p>


</div>





<div

style={{

display:"flex",
alignItems:"center",
gap:12

}}

>


<div

style={{

width:42,
height:42,
borderRadius:"50%",
background:"#D4AF37",
display:"flex",
alignItems:"center",
justifyContent:"center",
fontWeight:800

}}

>

A

</div>


<div>

<b>
Administrator
</b>

<br/>

<span

style={{

fontSize:12,
color:"#6b7280"

}}

>

Admin Account

</span>


</div>


</div>


</header>





<main

style={{

padding:30

}}

>

{children}

</main>



</div>



</div>


)

}