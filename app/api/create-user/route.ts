import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


export async function POST(req:Request){


try{


const body = await req.json();


const {
name,
email,
password,
role
}=body;



const supabaseAdmin = createClient(

process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!

);





const {data,error}=await supabaseAdmin.auth.admin.createUser({

email,
password,
email_confirm:true

});




if(error){

return NextResponse.json(

{
error:error.message
},

{
status:400
}

);

}




const user=data.user;



if(!user){

return NextResponse.json(

{
error:"User creation failed"
},

{
status:400
}

);

}





const {error:profileError}=await supabaseAdmin

.from("profiles")

.insert({

id:user.id,
full_name:name,
role:role,
active:true

});






if(profileError){


await supabaseAdmin.auth.admin.deleteUser(
user.id
);


return NextResponse.json(

{
error:profileError.message
},

{
status:400
}

);


}





return NextResponse.json({

success:true,
user:user.id

});





}
catch(error:any){


return NextResponse.json(

{
error:error.message || "Server error"
},

{
status:500
}

);


}


}