defmodule Chatroomserver do
  require Logger
  use Agent
  @moduledoc """
  Documentation for Chatroomserver.
  """

  @doc """
  Hello world.

  ## Examples

      iex> Chatroomserver.hello()
      :world

  """
  def hello do
    :world
  end

  def accept(port \\ 4041) do
    {:ok, socket} = :gen_tcp.listen(port, [:binary, packet: :line, active: false, reuseaddr: true])
    Logger.info("Accepting connection on port #{port}")
    {:ok, client_list} = Agent.start(fn -> [] end)
    loop_acceptor(socket, client_list)
  end

  defp loop_acceptor(socket, client_list) do
    {:ok, client} = :gen_tcp.accept(socket)
    Agent.update(client_list, fn list -> list = [client | list] end)
    spawn(fn -> serve(client, client_list) end)
    loop_acceptor(socket, client_list)
  end

  defp serve(client, client_list) do
    data = read_line(client)
    list = Agent.get(client_list, fn list -> list end)
    IO.inspect(list)
    Enum.each(list, fn x -> if x != client, do: :gen_tcp.send(x, data) end)
    serve(client, client_list)
  end

  defp read_line(client) do
    {:ok, data} = :gen_tcp.recv(client, 0)
    data
  end
end
