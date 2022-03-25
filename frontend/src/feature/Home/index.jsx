import { BigNumber } from "@ethersproject/bignumber";
import { formatEther, parseUnits } from "@ethersproject/units";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import ConnectWallet from "feature/connectWallet";
import PopupAction from "feature/PopupAction";
import { useEagerConnect, useInactiveListener } from "hooks/listener";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
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
import { useQueryHistory } from "request/query";
import { CHAIN_LIST, SC_DD2, SC_MasterChef, SC_WETH } from "utils/connect";
import { formatAmount } from "utils/format";
import DD2Abi from "../../ABI/DD2.json";
import MasterChefAbi from "../../ABI/MasterChef.json";
import WETHAbi from "../../ABI/WETH.json";
import {
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

  const [listHistory, setListHistory] = useState([]);

  const handleFetchData = useQueryHistory();

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

  const renderAccount = () => {
    return account ? account.slice(0, 6) + "..." + account.slice(-4) : "";
  };

  // Init
  const stateUpdate = harvesting && approving && staking && withdrawing;

  const getDataInfo = async () => {
    if (library && account) {
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
          callData: iFaceWETH.encodeFunctionData("totalSupply", []),
        },
        {
          target: SC_WETH,
          callData: iFaceWETH.encodeFunctionData("allowance", [
            account,
            SC_MasterChef,
          ]),
        },
      ];

      const multiResults = await multicallContract.aggregate(callDatas);
      // .returnData;
      // ?.returnData
      let decodedResults = [];
      if (multiResults) {
        const _multiResults = multiResults.returnData;
        decodedResults.push(
          iFaceWETH.decodeFunctionResult("balanceOf", _multiResults[0])
        );
        decodedResults.push(
          iFaceMasterChef.decodeFunctionResult("pendingDD2", _multiResults[1])
        );
        decodedResults.push(
          iFaceDD2.decodeFunctionResult("balanceOf", _multiResults[2])
        );
        decodedResults.push(
          iFaceWETH.decodeFunctionResult("totalSupply", _multiResults[3])
        );
        decodedResults.push(
          iFaceWETH.decodeFunctionResult("allowance", _multiResults[4])
        );
      }

      setBalanceWETH(decodedResults[0][0]);
      setPeddingDD2(decodedResults[1][0]);
      setBalanceDD2(decodedResults[2][0]);
      setTotalWETH(decodedResults[3][0]);
      // console.log(res[4]);
      setIsApprove(decodedResults[4][0] !== clearBigNumber);
    }
  };

  useEffect(() => {
    (async function () {
      //
      if (
        // Init app
        (library && !stateUpdate) ||
        // Or updated
        stateUpdate
      ) {
        getDataInfo();
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

  const fetchData = useCallback(async () => {
    try {
      const response = await handleFetchData();

      setListHistory(response?.data.historyEntities);
    } catch (e) {
      console.log(e);
    }
  }, [handleFetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!library) return;
    const masterChefContract = getContractMasterChef(library);
    masterChefContract.on("Deposit", fetchData).on("Withdraw", fetchData);
    return () => {
      masterChefContract
        .removeAllListeners("Deposit")
        .removeAllListeners("Withdraw");
    };
  }, [fetchData]);

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
              Balance: <b>{formatEther(balanceWETH)} WETH</b>
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

      <Card>
        <CardHeader>
          <Row className="justify-content-between align-items-center">
            <Col>
              <b>Transaction History</b>
            </Col>
          </Row>
        </CardHeader>
        <CardBody style={{ overflowY: "scroll", maxHeight: "40vh" }}>
          <Col>
            <ListGroup className="mt-3" horizontal>
              <ListGroupItem action>Action</ListGroupItem>
              <ListGroupItem action>Amount</ListGroupItem>
              <ListGroupItem action>Time</ListGroupItem>
            </ListGroup>
            {listHistory && listHistory.length ? (
              listHistory.map((h) => (
                <ListGroup className="mt-3" horizontal key={h.id}>
                  <ListGroupItem action>{h.eventName}</ListGroupItem>
                  <ListGroupItem action>
                    {formatAmount.format(formatEther(h.amount))}
                  </ListGroupItem>
                  <ListGroupItem action>
                    {moment
                      .unix(Number(h.transactionTime))
                      .format("kk:mm DD/MM/YYYY")}
                  </ListGroupItem>
                </ListGroup>
              ))
            ) : (
              <h4 style={{ textAlign: "center" }} className="mt-3">
                Not Transaction
              </h4>
            )}
          </Col>
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
