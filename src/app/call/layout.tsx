import React from "react";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return <div className="w-screen h-screen bg-black">{children}</div>;
};

export default Layout;
