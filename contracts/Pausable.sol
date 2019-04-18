pragma solidity >=0.4.21 <0.6.0;

import './Owned.sol';

contract Pausable is Owned {
  // is running
  bool private _isRunning;

  // event
  event SwitchRunningEvent(bool oldValue, bool newValue);

  // constructor
  constructor(bool isRunning) public {
    _isRunning = isRunning;
  }

  // modifier
  modifier runningOnly() {
    require(_isRunning);
    _;
  }
  
  // getter
  function isRunning() public view returns (bool) {
    return _isRunning;
  }

  // set running
  function switchRunning(bool running)
    public
    ownerOnly
  {
    bool oldValue = _isRunning;
    _isRunning = running;
    emit SwitchRunningEvent(oldValue, running);
  }
}