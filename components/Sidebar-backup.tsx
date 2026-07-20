"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";


export default function Sidebar(){


const pathname = usePathname();

const [open,setOpen]=useState(false);



const menu=[

["Dashboard","/dashboard"],
["Clients","/dashboard/clients"],
["Estimates","/dashboard/estimates"],
["Invoices","/dashboard/invoices"],
["Jobs","/dashboard/jobs"],
["Salesmen","/dashboard/salesmen"],
["Payments","/dashboard/payments"],
["Reports","/dashboard/reports"]

];



return(

<>

<button

onClick={()=>setOpen(!open)}

style={{

display:"none"

}}

className="mobileButton"

>

☰

</button>



<div

style={{

width:240,
padding:20,
borderRight:"1px solid #ddd",
minHeight:"100vh",
background:"#fff"

}}

>


<h2>
🏠 RoofFlowCRM
</h2>


<hr/>



{
menu.map((item)=>(

<Link

key={item[1]}

href={item[1]}

style={{

display:"block",
padding:12,
borderRadius:8,
marginBottom:5,
textDecoration:"none",

background:
pathname===item[1]
?
"#e5e7eb"
:
"transparent"

}}

>

{item[0]}

</Link>


))

}



<hr/>


<Link href="/login">
Logout
</Link>



</div>

</>

)

}