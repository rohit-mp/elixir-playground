defmodule EchoserverTest do
  use ExUnit.Case
  doctest Echoserver

  test "greets the world" do
    assert Echoserver.hello() == :world
  end
end
