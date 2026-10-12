"use client";
/**
 * Сад — постійний фон для всіх вкладок. Змонтований тут один раз, тому при
 * переході між вкладками сцена не перебудовується: камера, зум і хмари
 * лишаються там, де були. Вкладка приходить як children і спливає над садом.
 */
import GardenWorld from "@/components/garden3d/GardenWorld";
import Reminders from "@/components/system/Reminders";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Reminders />
      <GardenWorld>{children}</GardenWorld>
    </>
  );
}
