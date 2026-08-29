import "./globals.css";


export const metadata = {
  title:"All State Roofing",
  description:"Roofing Company CRM"
};


export const viewport = {
  width:"device-width",
  initialScale:1,
  maximumScale:5,
  userScalable:true
};


export default function RootLayout({
children,
}:{
children:React.ReactNode;
}){


return(

<html lang="en">

<body style={{ fontFamily: "Inter, Arial, sans-serif" }}>

{children}

</body>

</html>

);

}