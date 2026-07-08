import { motion } from "framer-motion";

export function Sheet(props: React.ComponentProps<typeof motion.div>) {
  return <motion.div {...props} />;
}
