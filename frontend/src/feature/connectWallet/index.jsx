/* eslint-disable react-hooks/exhaustive-deps */
import { useWeb3React } from "@web3-react/core";
import React, { useState } from "react";
import { Button, Col, Modal, ModalBody, ModalHeader, Row } from "reactstrap";
import { injected, walletConnect } from "../../utils/connect";

export default function ConnectWallet() {
  const web3React = useWeb3React();
  const { activate } = web3React;
  const [modal, setModal] = useState(false);
  const toggle = (connector) => {
    connector && !connector?.target && activate(connector);
    setModal(!modal);
  };

  return (
    <>
      <Button color="primary" size="sm" onClick={toggle}>
        Connect wallet
      </Button>

      <Modal isOpen={modal} toggle={toggle} centered>
        <ModalHeader toggle={toggle}>Connect with ...</ModalHeader>
        <ModalBody>
          <Row className="justify-content-center g-4">
            <Col>
              <Button
                block
                color="warning"
                onClick={() => {
                  toggle(injected);
                }}
              >
                MetaMask
              </Button>
              <Button
                block
                color="primary"
                onClick={() => {
                  toggle(walletConnect);
                }}
              >
                WalletConnect
              </Button>
            </Col>
          </Row>
        </ModalBody>
      </Modal>
    </>
  );
}
