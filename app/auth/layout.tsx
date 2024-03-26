const AuthLayout = ({ 
    children
  }: { 
    children: React.ReactNode
  }) => {
    return ( 
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-800">
        {children}
      </div>
     );
  }
   
  export default AuthLayout;