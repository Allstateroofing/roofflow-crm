"use client";

import {useEffect,useState} from "react";
import Sidebar from "@/components/Sidebar";
import {supabase} from "@/lib/supabase";


export default function DashboardLayout({

children

}:{
children:React.ReactNode
}){


const [profile,setProfile]=useState<any>(null);



useEffect(()=>{

loadProfile();

},[]);



async function loadProfile(){


const {
data:{
user
}

}=await supabase.auth.getUser();


if(!user) return;



const {data,error}=await supabase
.from("profiles")
.select("*")
.eq("id",user.id)
.single();



console.log("PROFILE:",data);
console.log("PROFILE ERROR:",error);


setProfile(data);

}



function roleTitle(){

if(profile?.role==="admin")
return "Administrator";


if(profile?.role==="secretary")
return "Office";


if(profile?.role==="salesman")
return profile?.full_name || "Salesman";


if(profile?.role==="worker")
return "Worker";


return "User";

}



function roleAccount(){

if(profile?.role==="admin")
return "Admin Account";


if(profile?.role==="secretary")
return "Secretary Account";


if(profile?.role==="salesman")
return "Salesman Account";


if(profile?.role==="worker")
return "Worker Account";


return "";

}




return (

<div
style={{
display:"flex",
minHeight:"100vh",
background:"#f8fafc"
}}
>


<Sidebar />


<div
style={{
flex:1
}}
>


<div
style={{
height:70,
display:"flex",
justifyContent:"flex-end",
alignItems:"center",
background:"#fff",
borderBottom:"1px solid #e5e7eb",
padding:"0 30px",
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

{profile?.full_name?.charAt(0) || "A"}

</div>



<div>

<div
style={{
fontWeight:700
}}
>

{roleTitle()}

</div>


<span
style={{
fontSize:12,
color:"#6b7280"
}}
>

{roleAccount()}

</span>


</div>


</div>



<main
style={{
padding:30
}}
>

{children}

</main>


</div>


</div>

);


}