"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "@/lib/supabase";


export default function LoginPage(){

const router = useRouter();

const [email,setEmail]=useState("");
const [password,setPassword]=useState("");
const [loading,setLoading]=useState(false);



async function login(){


console.log("LOGIN BUTTON CLICKED");


if(!email || !password){

alert("Enter email and password");
return;

}


setLoading(true);


try{


const {data,error}=await supabase.auth.signInWithPassword({

email:email.trim(),

password:password

});



console.log("AUTH DATA:",data);
console.log("AUTH ERROR:",error);



if(error){

alert(error.message);

setLoading(false);

return;

}



if(!data.user){

alert("No user found");

setLoading(false);

return;

}



const {data:profile,error:profileError}=await supabase

.from("profiles")

.select("role")

.eq("id",data.user.id)

.single();



console.log("PROFILE:",profile);
console.log("PROFILE ERROR:",profileError);



if(profileError){

alert(profileError.message);

setLoading(false);

return;

}



router.replace("/dashboard");



}

catch(err:any){

console.log(err);

alert(err.message || "Login error");


}

finally{

setLoading(false);

}


}




return(


<div

style={{

minHeight:"100vh",

background:"#111827",

display:"flex",

alignItems:"center",

justifyContent:"center",

padding:20

}}

>


<div

style={{

width:"100%",

maxWidth:420,

background:"#fff",

borderRadius:20,

padding:40,

boxShadow:"0 20px 50px rgba(0,0,0,.25)",

textAlign:"center"

}}

>



<img

src="/logo.png"

style={{

width:90,

height:90,

objectFit:"cover",

borderRadius:18,

marginBottom:20

}}

/>



<h1

style={{

fontSize:30,

fontWeight:900,

color:"#111827"

}}

>

All State Roofing

</h1>



<p

style={{

color:"#6b7280",

marginBottom:30

}}

>

Roofing Management System

</p>





<input

type="email"

placeholder="Email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

style={{

width:"100%",

padding:14,

borderRadius:10,

border:"1px solid #D1D5DB",

marginBottom:15,

fontSize:16,

boxSizing:"border-box"

}}

/>





<input

type="password"

placeholder="Password"

value={password}

onChange={(e)=>setPassword(e.target.value)}

style={{

width:"100%",

padding:14,

borderRadius:10,

border:"1px solid #D1D5DB",

marginBottom:20,

fontSize:16,

boxSizing:"border-box"

}}

/>





<button

type="button"

onClick={(e)=>{

e.preventDefault();

login();

}}

disabled={loading}

style={{

width:"100%",

padding:14,

background:"#D4AF37",

border:"none",

borderRadius:10,

fontWeight:800,

fontSize:16,

cursor:"pointer"

}}

>


{

loading

?

"Logging in..."

:

"Login"

}


</button>





<p

style={{

marginTop:25,

fontSize:12,

color:"#9CA3AF"

}}

>

Secure access for All State Roofing users

</p>



</div>


</div>


)

}