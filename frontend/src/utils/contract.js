import { Contract } from "@ethersproject/contracts";
import ABI_DD2 from "../ABI/DD2.json";
import ABI_MasterChef from "../ABI/MasterChef.json";
import ABI_WETH from "../ABI/WETH.json";
import ABI_MULTICALL from "../ABI/Multicall.json";
import { SC_DD2, SC_MasterChef, SC_MULTICALL, SC_WETH } from "./connect";

export const getContractWETH = (library) => {
  return new Contract(SC_WETH, ABI_WETH, library.getSigner());
};

export const getContractMasterChef = (library) => {
  return new Contract(SC_MasterChef, ABI_MasterChef, library.getSigner());
};

export const getContractDD2 = (library) => {
  return new Contract(SC_DD2, ABI_DD2, library.getSigner());
};

export const getContractMulticall = (library) => {
  return new Contract(SC_MULTICALL, ABI_MULTICALL, library.getSigner());
};
