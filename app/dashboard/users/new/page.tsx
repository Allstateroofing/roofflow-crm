"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";


export default function NewUserPage(){


const router = useRouter();


const [name,setName]=useState("");
const [email,setEmail]=useState("");
const [password,setPassword]=useState("");
const [role,setRole]=useState("salesman");



async function createUser(){


if(!name || !email || !password){

alert("Fill all fields");
return;

}



const response = await fetch("/api/create-user",{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

name,
email,
password,
role

})

});



const result = await response.json();



if(!response.ok){

alert(result.error);
return;

}



alert("User created");


router.push("/dashboard/users");


}





return(

<RoleGuard allowedRoles={["admin"]}>


<div style={{padding:30}}>


<h1>
Create User
</h1>



<input

placeholder="Full Name"

value={name}

onChange={(e)=>setName(e.target.value)}

style={{
padding:10,
width:300
}}

/>



<br/><br/>



<input

placeholder="Email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

style={{
padding:10,
width:300
}}

/>



<br/><br/>



<input

type="password"

placeholder="Password"

value={password}

onChange={(e)=>setPassword(e.target.value)}

style={{
padding:10,
width:300
}}

/>



<br/><br/>



<select

value={role}

onChange={(e)=>setRole(e.target.value)}

style={{
padding:10,
width:300
}}

>


<option value="secretary">
Secretary
</option>


<option value="manager">
Manager
</option>


<option value="salesman">
Salesman
</option>


<option value="worker">
Worker
</option>


</select>



<br/><br/>



<button

onClick={createUser}

>

Create User

</button>



</div>


</RoleGuard>

)

}