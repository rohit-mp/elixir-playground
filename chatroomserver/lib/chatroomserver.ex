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
    {:ok, name_map} = Agent.start(fn -> %{} end)
    loop_acceptor(socket, client_list, name_map)
  end

  defp loop_acceptor(socket, client_list, name_map) do
    {:ok, client} = :gen_tcp.accept(socket)
    name = get_name(client)
    Agent.update(client_list, fn list -> [client | list] end) 
    Agent.update(name_map, fn map -> Map.put(map, client, name) end)
    spawn(fn -> serve(client, client_list, name_map) end)
    loop_acceptor(socket, client_list, name_map)
  end

  defp get_name(client) do
    :gen_tcp.send(client, "Enter your name: ")
    {:ok, name} = :gen_tcp.recv(client, 0)
    name = name |> String.replace("\r", "") |> String.replace("\n", "")
    IO.inspect(name)
    name
  end

  defp serve(client, client_list, name_map) do
    read_data = read_line(client)
    if read_data == ":exit\r\n" do
      Agent.update(client_list, fn list -> Enum.filter(list, fn x -> x != client end) end)
      Agent.update(name_map, fn map -> Map.delete(map, client) end)
    else
      send_data = Agent.get(name_map, fn map -> Map.get(map, client) end) <> ": " <> read_data
      list = Agent.get(client_list, fn list -> list end)
      Enum.each(list, fn x -> if x != client, do: :gen_tcp.send(x, send_data) end)
      serve(client, client_list, name_map)
    end
  end

  defp read_line(client) do
    {:ok, data} = :gen_tcp.recv(client, 0)
    data
  end
end
