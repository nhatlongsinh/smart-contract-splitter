pragma solidity >=0.4.21 <0.6.0;

import './Owned.sol';

contract Pausable is Owned{
  // is running
  bool _isRunning;
  // event
  event switchRunningEvent(bool oldValue, bool newValue);
  // constructor
  constructor()public{
    _isRunning=true;
  }
  // modifier
  modifier runningOnly() {
    require(_isRunning==true);
    _;
  }
  // set running
  function switchRunning(bool running) public ownerOnly{
    bool oldValue=_isRunning;
    _isRunning=running;
    emit switchRunningEvent(oldValue, running);
  }
}