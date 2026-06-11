"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Form from "./components/form";

const Map = dynamic(() => import("./components/map"), { ssr: false });

export default function Home() {
  const [pos, setPos] = useState<[number, number]>([14.5547, 121.0244]);

  return (
    <main style={{ height: "100vh", width: "100%", position: "relative" }}>
      <Map onPosChange={setPos} />
      <Form lat={pos[0]} lng={pos[1]} />
    </main>
  );
}
