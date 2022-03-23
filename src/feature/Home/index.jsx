import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, parseUnits } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import ConnectWallet from "feature/connectWallet";
import PopupAction from "feature/PopupAction";
import { useEagerConnect, useInactiveListener } from "hooks/listener";
import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  ListGroup,
  ListGroupItem,
  Row,
  Spinner,
} from "reactstrap";
import { CHAIN_LIST, SC_DD2, SC_MasterChef, SC_WETH } from "utils/connect";
import { formatAmount } from "utils/format";
import DD2Abi from "../../ABI/DD2.json";
import MasterChefAbi from "../../ABI/MasterChef.json";
import WETHAbi from "../../ABI/WETH.json";
import {
  getContractDD2,
  getContractMasterChef,
  getContractMulticall,
  getContractWETH,
} from "../../utils/contract";

function Message({ setting }) {
  const { show, key, msg } = setting;
  return (
    show && (
      <Alert color={key === "SUCCESS" ? "success" : "danger"}>{msg}</Alert>
    )
  );
}

function PopupStake(props) {
  return <PopupAction title="Stake" {...props} currency="WETH" />;
}

function PopupWithdraw(props) {
  return <PopupAction title="Withdraw" {...props} currency="DD2" />;
}

const Home = (props) => {
  const { chainId, library, account, deactivate } = useWeb3React();
  const [isApprove, setIsApprove] = useState(false);
  const [msg, setMsg] = useState({
    show: false,
    type: null,
    msg: "",
  });

  const clearBigNumber = BigNumber.from(0);
  const [balanceWETH, setBalanceWETH] = useState(clearBigNumber);
  const [pendingDD2, setPeddingDD2] = useState(clearBigNumber);
  const [balanceDD2, setBalanceDD2] = useState(clearBigNumber);
  const [totalWETH, setTotalWETH] = useState(clearBigNumber);

  //Loading
  const [harvesting, setHarvesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [staking, setStaking] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  //Popup
  const [showStake, setShowStake] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const triedEager = useEagerConnect();

  useInactiveListener(!triedEager);

  // App
  const showMessage = (key, content) => {
    setMsg({
      ...msg,
      show: true,
      key,
      msg: content,
    });

    setTimeout(() => {
      setMsg({
        ...msg,
        show: false,
      });
    }, 3000);
  };
  const showMessageSuccess = (content) => {
    showMessage("SUCCESS", content);
  };
  const showMessageError = (content) => {
    showMessage("ERROR", content);
  };

  const getBalanceWETH = async () => {
    const WETHContract = getContractWETH(library);
    const balance = await WETHContract.balanceOf(account);
    return balance;
  };

  const getPendingDD2 = async () => {
    const masterChefContract = getContractMasterChef(library);
    const pendding = await masterChefContract.pendingDD2(account);
    return pendding;
  };
  const getBalanceDD2 = async () => {
    const DD2Contract = getContractDD2(library);
    const balance = await DD2Contract.balanceOf(account);
    return balance;
  };
  const getTotalWETH = async () => {
    const WETHContract = getContractWETH(library);
    const balance = await WETHContract.totalSupply();
    return balance;
  };

  const getStatusApprove = async () => {
    const WETHContract = getContractWETH(library);
    const allowance = await WETHContract.allowance(account, SC_MasterChef);
    return allowance;
    // setIsApprove()
  };

  const renderAccount = () => {
    return account ? account.slice(0, 6) + "..." + account.slice(-4) : "";
  };

  // Init
  const stateUpdate = harvesting && approving && staking && withdrawing;

  const getDataInfo = async () => {
    if (library) {
      const multicallContract = getContractMulticall(library);
      let iFaceWETH = new ethers.utils.Interface(WETHAbi);
      let iFaceDD2 = new ethers.utils.Interface(DD2Abi);
      let iFaceMasterChef = new ethers.utils.Interface(MasterChefAbi);
      const callDatas = [
        {
          target: SC_WETH,
          callData: iFaceWETH.encodeFunctionData("balanceOf", [account]),
        },
        {
          target: SC_MasterChef,
          callData: iFaceMasterChef.encodeFunctionData("pendingDD2", [account]),
        },
        {
          target: SC_DD2,
          callData: iFaceDD2.encodeFunctionData("balanceOf", [account]),
        },
        {
          target: SC_WETH,
          callData: iFaceWETH.encodeFunctionData("totalSupply", [account]),
        },
        {
          target: SC_WETH,
          callData: iFaceWETH.encodeFunctionData("allowance", [
            account,
            SC_MasterChef,
          ]),
        },
      ];

      // const multiResults = await multicallContract.aggregate(callDatas)
      //   .returnData;
      // let decodedResults = [];
      // decodedResults.push(
      //   iFaceWETH.decodeFunctionResult("balanceOf", multiResults[0])
      // );
      // decodedResults.push(
      //   iFaceMasterChef.decodeFunctionResult("pendingDD2", multiResults[1])
      // );
      // decodedResults.push(
      //   iFaceDD2.decodeFunctionResult("balanceOf", multiResults[2])
      // );
      // decodedResults.push(
      //   iFaceWETH.decodeFunctionResult("totalSupply", multiResults[3])
      // );
      // decodedResults.push(
      //   iFaceWETH.decodeFunctionResult("allowance", multiResults[4])
      // );
      console.log(callDatas);

      // return decodedResults;
    }
  };

  getDataInfo();

  useEffect(() => {
    (async function () {
      //
      if (
        // Init app
        (library && !stateUpdate) ||
        // Or updated
        stateUpdate
      ) {
        Promise.all([
          getPendingDD2(),
          getBalanceDD2(),
          getTotalWETH(),
          getBalanceWETH(),
          getStatusApprove(),
        ]).then((res) => {
          setPeddingDD2(res[0]);
          setBalanceDD2(res[1]);
          setTotalWETH(res[2]);
          setBalanceWETH(res[3]);
          // console.log(res[4]);
          setIsApprove(res[4] !== clearBigNumber);
        });
      }
      if (!account) {
        setPeddingDD2(clearBigNumber);
        setBalanceDD2(clearBigNumber);
        setTotalWETH(clearBigNumber);
        setBalanceWETH(clearBigNumber);
      }
    })();
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [account, library, chainId, harvesting, approving, staking, withdrawing]);

  // ACTION
  const onClickApprove = async (e) => {
    // UI
    setApproving(true);
    // Call
    const myContract = getContractWETH(library);
    // Sent
    myContract
      .approve(SC_MasterChef, balanceWETH.toString())
      .then(async (res) => {
        await res.wait();
        showMessageSuccess("Approve success !");
        setIsApprove(true);
        setApproving(false);
      })
      .catch((err) => {
        showMessageError(err.stack);
        setApproving(false);
      });
  };
  const toggleStake = () => {
    setShowStake(!showStake);
  };
  const toggleWithdraw = () => {
    setShowWithdraw(!showWithdraw);
  };

  const onClickHarvest = async () => {
    setHarvesting(true);
    const masterChefContract = getContractMasterChef(library);
    await masterChefContract
      .withdraw(0)
      .then(async (res) => {
        await res.wait();
        setHarvesting(false);
        showMessageSuccess("Harvest success !");
      })
      .catch((err) => {
        showMessageError(err.stack);
        setHarvesting(false);
      });
  };

  const onSubmitStake = async (value) => {
    console.log(value, balanceWETH);
    if (value <= balanceWETH.toString()) {
      // UI
      setStaking(true);
      setShowStake(false);
      // Call
      const masterChefContract = getContractMasterChef(library);

      masterChefContract
        .deposit(parseUnits(value, 18))
        .then(async (res) => {
          await res.wait();
          showMessageSuccess("Stake success !");
          setStaking(false);
        })
        .catch((err) => {
          showMessageError(err.stack);
          setStaking(false);
        });
    }
  };
  const onSubmitWithdraw = async (value) => {
    console.log(value, balanceDD2.toString());
    if (value <= balanceDD2.toString()) {
      // UI
      setWithdrawing(true);
      setShowWithdraw(false);
      // Call
      const masterChefContract = getContractMasterChef(library);

      masterChefContract
        .withdraw(parseUnits(value, 18))
        .then(async (res) => {
          await res.wait();
          showMessageSuccess("Withdraw WETH success !");
          setWithdrawing(false);
        })
        .catch((err) => {
          showMessageError(err.stack);
          setWithdrawing(false);
        });
    }
  };
  return (
    <Container>
      <Message setting={msg} />
      <Card>
        <CardHeader>
          <Row className="justify-content-between align-items-center">
            <Col>
              <b>Stake token</b>
            </Col>
            <Col className="text-right">{!account && <ConnectWallet />}</Col>
          </Row>
        </CardHeader>
        <CardBody>
          <Row>
            <Col sm={12}>
              Wallet address: <b>{renderAccount()}</b>
              {account && (
                <Badge
                  href="#"
                  color="danger"
                  className="ml-2"
                  onClick={() => {
                    deactivate();
                  }}
                >
                  Logout
                </Badge>
              )}
            </Col>
            <Col className="mt-2">
              Network: <b>{CHAIN_LIST[chainId]}</b>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col sm={12}>
              Balance:{" "}
              <b>{formatAmount.format(formatEther(balanceWETH))} WETH</b>
            </Col>
          </Row>
          <Row className="justify-content-between align-items-center">
            <Col>
              Token earned:{" "}
              <b>{formatAmount.format(formatEther(pendingDD2))} DD2</b>
            </Col>
            <Col className="text-sm-right" sm="4" xs={12}>
              <Button
                color="success"
                onClick={onClickHarvest}
                disabled={harvesting || !account}
              >
                Harvest {harvesting && <Spinner size="sm" color="light" />}
              </Button>
            </Col>
          </Row>
          <Row className="mt-3">
            {!isApprove ? (
              <Col>
                <Button
                  size="lg"
                  color="primary"
                  block
                  onClick={onClickApprove}
                  disabled={approving || !account}
                >
                  Approve {approving && <Spinner size="sm" color="light" />}
                </Button>
              </Col>
            ) : (
              <>
                <Col>
                  <Button
                    size="lg"
                    className="w-100"
                    color="primary"
                    onClick={toggleStake}
                    disabled={staking}
                  >
                    Stake {staking && <Spinner size="sm" color="light" />}
                  </Button>
                </Col>
                <Col>
                  <Button
                    size="lg"
                    className="w-100"
                    onClick={toggleWithdraw}
                    disabled={withdrawing}
                  >
                    Withdraw{" "}
                    {withdrawing && <Spinner size="sm" color="light" />}
                  </Button>
                </Col>
              </>
            )}
          </Row>
          {/*  */}
          <ListGroup className="mt-3" horizontal>
            <ListGroupItem action>Your stake</ListGroupItem>
            <ListGroupItem action>
              {/* {`${balanceDD2} Token`} */}
              {`${formatEther(balanceDD2)} DD2`}
            </ListGroupItem>
          </ListGroup>
          <ListGroup className="mt-3" horizontal>
            <ListGroupItem action>Total stake</ListGroupItem>
            <ListGroupItem action>
              {`${formatAmount.format(formatEther(totalWETH))} WETH`}
            </ListGroupItem>
          </ListGroup>
        </CardBody>
      </Card>

      {/* Popup */}
      <PopupStake
        show={showStake}
        balance={formatEther(balanceWETH)}
        onToggle={toggleStake}
        onSubmit={onSubmitStake}
      />
      <PopupWithdraw
        show={showWithdraw}
        balance={formatEther(pendingDD2)}
        onToggle={toggleWithdraw}
        onSubmit={onSubmitWithdraw}
      />
    </Container>
  );
};

export default Home;
