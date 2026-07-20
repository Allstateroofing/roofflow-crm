"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


export default function LoginPage(){

const router = useRouter();


const [email,setEmail]=useState("");
const [password,setPassword]=useState("");
const [loading,setLoading]=useState(false);



async function login(){

if(!email || !password){

alert("Enter email and password");
return;

}


setLoading(true);


try{


const {data,error}=await supabase.auth.signInWithPassword({

email: email.trim(),

password: password

});



if(error){

alert(error.message);

setLoading(false);

return;

}



if(!data.user){

alert("Login failed");

setLoading(false);

return;

}



const {data:profile,error:profileError}=await supabase
.from("profiles")
.select("role")
.eq("id",data.user.id)
.maybeSingle();


if(profileError){

alert(profileError.message);
return;

}


if(
profile.role === "admin" ||
profile.role === "secretary" ||
profile.role === "salesman" ||
profile.role === "worker"
){

alert("Login successful");

router.push("/dashboard");

}else{

alert("User role not configured");

}



}
catch(error:any){

alert(
error.message || "Something went wrong"
);


}
finally{


setLoading(false);


}


}





return (

<div

style={{
padding:40,
maxWidth:400,
margin:"50px auto",
border:"1px solid #ddd",
borderRadius:12
}}

>


<h1>
RoofFlowCRM Login
</h1>



<input

style={{
width:"100%",
padding:12,
marginBottom:15,
boxSizing:"border-box"
}}

type="email"

placeholder="Email"

value={email}

onChange={(e)=>
setEmail(e.target.value)
}

/>



<input

style={{
width:"100%",
padding:12,
marginBottom:15,
boxSizing:"border-box"
}}

type="password"

placeholder="Password"

value={password}

onChange={(e)=>
setPassword(e.target.value)
}

/>



<button

style={{
width:"100%",
padding:12,
cursor:"pointer"
}}

onClick={login}

disabled={loading}

>

{
loading
?
"Logging in..."
:
"Login"
}


</button>



</div>

)

}