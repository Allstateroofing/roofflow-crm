"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";


export default function RoleGuard({

children,
allowedRoles

}:{

children:React.ReactNode;
allowedRoles:string[];

}){


const router = useRouter();

const [loading,setLoading]=useState(true);



useEffect(()=>{

checkRole();

},[]);



async function checkRole(){


const {
data:{
user
}

}=await supabase.auth.getUser();



if(!user){

router.push("/login");
return;

}



const {data,error}=await supabase
.from("profiles")
.select("role,active")
.eq("id",user.id)
.single();



if(error || !data){

router.push("/dashboard");
return;

}



if(!data.active){

router.push("/login");
return;

}



if(!allowedRoles.includes(data.role)){

router.push("/dashboard");
return;

}



setLoading(false);


}



if(loading){

return null;

}



return <>{children}</>;

}