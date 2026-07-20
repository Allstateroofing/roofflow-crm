"use client";

import { useEffect, useState } from "react";
import { useParams,useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/components/auth/RoleGuard";


export default function EditUserPage(){


const params = useParams();

const id = params.id as string;

const router=useRouter();


const [name,setName]=useState("");
const [role,setRole]=useState("");
const [active,setActive]=useState(true);



useEffect(() => {

  if (id) {
    loadUser();
  }

}, [id]);



async function loadUser(){


const {data,error}=await supabase
.from("profiles")
.select("*")
.eq("id",id)
.single();



if(error){

alert(error.message);
return;

}



setName(data.full_name || "");
setRole(data.role);
setActive(data.active);


}





async function updateUser(){


const {error}=await supabase
.from("profiles")
.update({

full_name:name,
role,
active

})
.eq("id",id);



if(error){

alert(error.message);
return;

}



alert("User updated");

router.push("/dashboard/users");


}





return(

<RoleGuard allowedRoles={["admin"]}>


<div style={{padding:30}}>


<h1>
Edit User
</h1>



<input

value={name}

onChange={(e)=>setName(e.target.value)}

placeholder="Name"

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


<option value="admin">
Admin
</option>

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



<label>

<input

type="checkbox"

checked={active}

onChange={(e)=>setActive(e.target.checked)}

/>

 Active

</label>



<br/><br/>



<button

onClick={updateUser}

>

Save Changes

</button>



</div>


</RoleGuard>

)

}