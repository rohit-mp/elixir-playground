defmodule ChatroomserverTest do
  use ExUnit.Case
  doctest Chatroomserver

  test "greets the world" do
    assert Chatroomserver.hello() == :world
  end
end
